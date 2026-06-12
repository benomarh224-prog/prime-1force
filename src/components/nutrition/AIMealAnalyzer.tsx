'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Beef,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  ImagePlus,
  Loader2,
  Save,
  ScanLine,
  Sparkles,
  Trash2,
  UploadCloud,
  Wheat,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type FoodEstimate = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

type MealAnalysis = {
  foods: FoodEstimate[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: number;
  accuracyNote: string;
  provider: 'openai' | 'gemini' | 'openrouter' | 'zai-vision' | 'demo-estimate' | 'open-food-facts';
};

type SavedMeal = MealAnalysis & {
  id: string;
  savedAt: string;
};

type AIMealAnalyzerProps = {
  dailyTargets: {
    calories: number;
    protein: number;
  };
};

const HISTORY_KEY = 'primeforge-ai-meal-history';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function metricFormat(value: number, suffix: string) {
  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function savedMealDateKey(savedAt: string) {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime()) ? '' : todayKey(date);
}

function isSavedMeal(value: unknown): value is SavedMeal {
  if (!value || typeof value !== 'object') return false;

  const meal = value as Partial<SavedMeal>;
  const totals = meal.totals;
  return (
    typeof meal.id === 'string' &&
    typeof meal.savedAt === 'string' &&
    savedMealDateKey(meal.savedAt) !== '' &&
    Array.isArray(meal.foods) &&
    meal.foods.length > 0 &&
    meal.foods.every(
      (food) =>
        food &&
        typeof food.name === 'string' &&
        typeof food.servingSize === 'string' &&
        Number.isFinite(food.calories) &&
        Number.isFinite(food.protein) &&
        Number.isFinite(food.carbs) &&
        Number.isFinite(food.fat) &&
        Number.isFinite(food.confidence)
    ) &&
    Boolean(totals) &&
    Number.isFinite(totals?.calories) &&
    Number.isFinite(totals?.protein) &&
    Number.isFinite(totals?.carbs) &&
    Number.isFinite(totals?.fat) &&
    Number.isFinite(meal.confidence) &&
    typeof meal.accuracyNote === 'string' &&
    typeof meal.provider === 'string'
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not preview this image.'));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File) {
  if (file.size <= 1_200_000) return file;

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not optimize this image.'));
      img.src = imageUrl;
    });

    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function NutritionMetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Flame;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={cn('h-4 w-4', tone)} />
      </div>
      <p className="text-2xl font-black">
        {metricFormat(value, suffix)}
      </p>
    </div>
  );
}

function providerLabel(provider: MealAnalysis['provider']) {
  const labels: Record<MealAnalysis['provider'], string> = {
    openai: 'OpenAI vision',
    gemini: 'Gemini vision',
    openrouter: 'OpenRouter vision',
    'zai-vision': 'ZAI vision',
    'demo-estimate': 'Demo estimate',
    'open-food-facts': 'Open Food Facts',
  };

  return labels[provider];
}

export function AIMealAnalyzer({ dailyTargets }: AIMealAnalyzerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileSelectionIdRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [history, setHistory] = useState<SavedMeal[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [fallbackReason, setFallbackReason] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as unknown;
      setHistory(Array.isArray(parsed) ? parsed.filter(isSavedMeal).slice(0, 30) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const todayMeals = history.filter((meal) => savedMealDateKey(meal.savedAt) === todayKey());
  const todayTotals = todayMeals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.totals.calories,
      protein: sum.protein + meal.totals.protein,
      carbs: sum.carbs + meal.totals.carbs,
      fat: sum.fat + meal.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = todayKey(date);
      const meals = history.filter((meal) => savedMealDateKey(meal.savedAt) === key);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: meals.reduce((sum, meal) => sum + meal.totals.calories, 0),
        protein: meals.reduce((sum, meal) => sum + meal.totals.protein, 0),
      };
    });
    return days;
  }, [history]);

  const saveHistory = (nextHistory: SavedMeal[]) => {
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory.slice(0, 30)));
  };

  const validateAndSetFile = async (file: File) => {
    const selectionId = ++fileSelectionIdRef.current;
    setError('');
    setFallbackReason('');
    setAnalysis(null);
    setSelectedFile(null);
    setPreview('');

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP meal photo.');
      return;
    }

    try {
      const optimized = await compressImage(file);
      if (selectionId !== fileSelectionIdRef.current) return;

      if (optimized.size > MAX_UPLOAD_BYTES) {
        setError('Image is too large. Upload a photo under 5MB.');
        return;
      }

      if (optimized.size === 0) {
        setError('This image is empty. Choose another meal photo.');
        return;
      }

      const nextPreview = await readFileAsDataUrl(optimized);
      if (selectionId !== fileSelectionIdRef.current) return;

      setSelectedFile(optimized);
      setPreview(nextPreview);
    } catch (caughtError) {
      if (selectionId !== fileSelectionIdRef.current) return;
      setError(caughtError instanceof Error ? caughtError.message : 'Could not process this image.');
    }
  };

  const analyzeMeal = async () => {
    if (!selectedFile) {
      setError('Upload or take a meal photo first.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setFallbackReason('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('/api/nutrition/analyze-meal', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        analysis?: MealAnalysis;
        fallback?: boolean;
        fallbackReason?: string;
      };
      if (!response.ok || !data.success || !data.analysis) throw new Error(data.error || 'Could not analyze meal.');

      setAnalysis(data.analysis);
      setFallbackReason(data.fallback ? data.fallbackReason || data.analysis.accuracyNote : '');
      toast({
        title: data.fallback ? 'Estimate generated' : 'Meal analyzed',
        description: data.fallback
          ? data.fallbackReason || 'AI vision is unavailable right now, so PrimeForge used a demo estimate.'
          : 'Nutrition estimates are ready for review.',
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not analyze meal.');
      setFallbackReason('');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = () => {
    if (!analysis) return;
    const savedMeal: SavedMeal = {
      ...analysis,
      id: `meal-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };

    saveHistory([savedMeal, ...history]);
    toast({ title: 'Meal saved', description: 'Added to your PrimeForge meal history.' });
  };

  const removeMeal = (id: string) => {
    saveHistory(history.filter((meal) => meal.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
              <ScanLine className="h-4 w-4 text-primary" />
              AI Meal Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                const file = event.dataTransfer.files?.[0];
                if (file) validateAndSetFile(file);
              }}
              className={cn(
                'relative overflow-hidden rounded-lg border border-dashed p-5 transition-colors',
                dragActive ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'
              )}
            >
              {preview ? (
                <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-center">
                  <div
                    className="aspect-square rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url('${preview}')` }}
                  />
                  <div className="space-y-3">
                    <Badge variant="outline" className="rounded-md">
                      Optimized upload
                    </Badge>
                    <h3 className="text-2xl font-black uppercase">Ready to analyze</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      We compress large images in the browser before upload to keep analysis fast and low-cost.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={analyzeMeal} disabled={analyzing} className="h-11 rounded-lg font-bold">
                        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {analyzing ? 'Analyzing...' : 'Analyze Meal'}
                      </Button>
                      <Button variant="outline" onClick={() => inputRef.current?.click()} className="h-11 rounded-lg font-bold">
                        <ImagePlus className="h-4 w-4" />
                        Replace
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex min-h-72 w-full flex-col items-center justify-center rounded-lg text-center"
                >
                  <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UploadCloud className="h-8 w-8" />
                  </span>
                  <span className="text-2xl font-black uppercase">Drop a meal photo</span>
                  <span className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Drag and drop, upload from gallery, or take a photo on mobile.
                  </span>
                  <span className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="rounded-md">JPEG</Badge>
                    <Badge variant="outline" className="rounded-md">PNG</Badge>
                    <Badge variant="outline" className="rounded-md">WebP</Badge>
                    <Badge variant="outline" className="rounded-md">Max 5MB</Badge>
                  </span>
                </button>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) validateAndSetFile(file);
                }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {fallbackReason && !error && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{fallbackReason}</p>
              </div>
            )}

            {analyzing && (
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-bold">Scanning plate geometry, foods, and portion size</span>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <Progress value={68} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
              <TargetIcon />
              Daily Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <NutritionMetricCard label="Calories" value={todayTotals.calories} suffix=" cal" icon={Flame} tone="text-orange-400" />
              <NutritionMetricCard label="Protein" value={todayTotals.protein} suffix="g" icon={Beef} tone="text-emerald-400" />
              <NutritionMetricCard label="Carbs" value={todayTotals.carbs} suffix="g" icon={Wheat} tone="text-amber-400" />
              <NutritionMetricCard label="Fat" value={todayTotals.fat} suffix="g" icon={Droplets} tone="text-sky-400" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
                <span>Calories</span>
                <span>{todayTotals.calories}/{dailyTargets.calories}</span>
              </div>
              <Progress value={Math.min(100, (todayTotals.calories / dailyTargets.calories) * 100)} className="h-2" />
              <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
                <span>Protein</span>
                <span>{todayTotals.protein}/{dailyTargets.protein}g</span>
              </div>
              <Progress value={Math.min(100, (todayTotals.protein / dailyTargets.protein) * 100)} className="h-2" />
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.17 0.012 95)',
                      border: '1px solid oklch(1 0 0 / 12%)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="calories" stroke="oklch(0.68 0.19 35)" fill="oklch(0.68 0.19 35 / 0.18)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Nutrition Estimate</h2>
              <p className="mt-1 text-sm text-muted-foreground">{analysis.accuracyNote}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={analysis.provider === 'demo-estimate' ? 'secondary' : 'default'} className="rounded-md">
                {providerLabel(analysis.provider)}
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {analysis.confidence}% confidence
              </Badge>
              <Button onClick={saveMeal} className="h-10 rounded-lg font-bold">
                <Save className="h-4 w-4" />
                Save Meal
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NutritionMetricCard label="Calories" value={analysis.totals.calories} suffix=" cal" icon={Flame} tone="text-orange-400" />
            <NutritionMetricCard label="Protein" value={analysis.totals.protein} suffix="g" icon={Beef} tone="text-emerald-400" />
            <NutritionMetricCard label="Carbs" value={analysis.totals.carbs} suffix="g" icon={Wheat} tone="text-amber-400" />
            <NutritionMetricCard label="Fat" value={analysis.totals.fat} suffix="g" icon={Droplets} tone="text-sky-400" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Detected Foods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.foods.map((food) => (
                  <div key={`${food.name}-${food.servingSize}`} className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-black uppercase">{food.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{food.servingSize}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{food.calories} cal</span>
                        <span>P {food.protein}g</span>
                        <span>C {food.carbs}g</span>
                        <span>F {food.fat}g</span>
                      </div>
                    </div>
                    <div className="min-w-28">
                      <div className="mb-1 flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                        <span>Accuracy</span>
                        <span>{food.confidence}%</span>
                      </div>
                      <Progress value={food.confidence} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Macro Split
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Protein', grams: analysis.totals.protein },
                      { name: 'Carbs', grams: analysis.totals.carbs },
                      { name: 'Fat', grams: analysis.totals.fat },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(0.17 0.012 95)',
                        border: '1px solid oklch(1 0 0 / 12%)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="grams" fill="oklch(0.62 0.24 27)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
            <Clock className="h-4 w-4 text-primary" />
            Meal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Save analyzed meals and your history, daily totals, and charts will appear here.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {history.slice(0, 9).map((meal) => (
                <div key={meal.id} className="rounded-lg border bg-muted/20 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black uppercase">{meal.foods.map((food) => food.name).join(', ')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(meal.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {meal.confidence}% confidence
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => removeMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-md bg-background/70 p-2">
                      <p className="font-black">{meal.totals.calories}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Cal</p>
                    </div>
                    <div className="rounded-md bg-background/70 p-2">
                      <p className="font-black">{meal.totals.protein}g</p>
                      <p className="text-[10px] uppercase text-muted-foreground">P</p>
                    </div>
                    <div className="rounded-md bg-background/70 p-2">
                      <p className="font-black">{meal.totals.carbs}g</p>
                      <p className="text-[10px] uppercase text-muted-foreground">C</p>
                    </div>
                    <div className="rounded-md bg-background/70 p-2">
                      <p className="font-black">{meal.totals.fat}g</p>
                      <p className="text-[10px] uppercase text-muted-foreground">F</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TargetIcon() {
  return <Camera className="h-4 w-4 text-primary" />;
}
