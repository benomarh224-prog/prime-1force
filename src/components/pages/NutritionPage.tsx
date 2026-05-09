'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Apple,
  Beef,
  Calculator,
  Coffee,
  Droplets,
  Flame,
  Leaf,
  Moon,
  Plus,
  Scale,
  Search,
  ShoppingBasket,
  Sun,
  Target,
  Trash2,
  Utensils,
  Wheat,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { foodDatabase, mealPlans, type FoodItem } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const categoryMeta = {
  breakfast: { icon: Coffee, label: 'Breakfast', tone: 'text-amber-400', bg: 'bg-amber-400/10' },
  lunch: { icon: Sun, label: 'Lunch', tone: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  dinner: { icon: Moon, label: 'Dinner', tone: 'text-sky-400', bg: 'bg-sky-400/10' },
  snack: { icon: Apple, label: 'Snack', tone: 'text-rose-400', bg: 'bg-rose-400/10' },
};

const macroColors = {
  protein: 'oklch(0.72 0.19 155)',
  carbs: 'oklch(0.75 0.12 60)',
  fat: 'oklch(0.60 0.15 250)',
};

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk day', multiplier: 1.2 },
  { value: 'light', label: 'Light', desc: '1-3 sessions', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderate', desc: '3-5 sessions', multiplier: 1.55 },
  { value: 'active', label: 'Active', desc: '6-7 sessions', multiplier: 1.725 },
  { value: 'very_active', label: 'Athlete', desc: 'Hard daily work', multiplier: 1.9 },
];

type SelectedFood = FoodItem & {
  grams: number;
};

const localFoodIds = new Set([
  'couscous',
  'tuna',
  'eggs',
  'whole-milk',
  'olive-oil',
  'tomato',
  'mixed-salad',
  'bread-whole',
  'shrimp',
  'orange-juice',
]);

function scaleFood(food: SelectedFood) {
  const factor = food.grams / food.servingGrams;
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor),
    carbs: Math.round(food.carbs * factor),
    fat: Math.round(food.fat * factor),
  };
}

function getGoalLabel(goal: string) {
  if (goal === 'lose_weight') return 'fat loss';
  if (goal === 'gain_muscle') return 'muscle gain';
  if (goal === 'increase_endurance') return 'endurance';
  return 'maintenance';
}

export function NutritionPage() {
  const { userWeight, userHeight, userGoal } = useAppStore();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('25');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);

  const totals = useMemo(() => {
    const calories = mealPlans.reduce((sum, meal) => sum + meal.calories, 0);
    const protein = mealPlans.reduce((sum, meal) => sum + meal.protein, 0);
    const carbs = mealPlans.reduce((sum, meal) => sum + meal.carbs, 0);
    const fat = mealPlans.reduce((sum, meal) => sum + meal.fat, 0);

    return { calories, protein, carbs, fat };
  }, []);

  const calculator = useMemo(() => {
    const parsedAge = Math.max(14, Number(age) || 25);
    const multiplier = activityLevels.find((level) => level.value === activityLevel)?.multiplier ?? 1.55;
    const bmr =
      gender === 'male'
        ? 10 * userWeight + 6.25 * userHeight - 5 * parsedAge + 5
        : 10 * userWeight + 6.25 * userHeight - 5 * parsedAge - 161;
    const tdee = bmr * multiplier;
    const goalCalories =
      userGoal === 'lose_weight'
        ? tdee - 450
        : userGoal === 'gain_muscle'
          ? tdee + 300
          : tdee;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalCalories: Math.round(goalCalories),
      protein: Math.round((goalCalories * 0.3) / 4),
      carbs: Math.round((goalCalories * 0.45) / 4),
      fat: Math.round((goalCalories * 0.25) / 9),
    };
  }, [activityLevel, age, gender, userGoal, userHeight, userWeight]);

  const macroDistribution = [
    { name: 'Protein', value: calculator.protein * 4, grams: calculator.protein, fill: macroColors.protein },
    { name: 'Carbs', value: calculator.carbs * 4, grams: calculator.carbs, fill: macroColors.carbs },
    { name: 'Fat', value: calculator.fat * 9, grams: calculator.fat, fill: macroColors.fat },
  ];

  const foodMatches = foodDatabase
    .filter((food) => {
      const query = foodSearch.toLowerCase().trim();
      if (!query) return localFoodIds.has(food.id);
      return food.name.toLowerCase().includes(query) || food.category.toLowerCase().includes(query);
    })
    .slice(0, 10);

  const builderTotals = selectedFoods.reduce(
    (totals, food) => {
      const scaled = scaleFood(food);
      return {
        calories: totals.calories + scaled.calories,
        protein: totals.protein + scaled.protein,
        carbs: totals.carbs + scaled.carbs,
        fat: totals.fat + scaled.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const shoppingList = [
    ...new Set([
      ...mealPlans.flatMap((meal) => meal.ingredients),
      ...selectedFoods.map((food) => food.name),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const addFood = (food: FoodItem) => {
    setSelectedFoods((current) => [
      ...current,
      {
        ...food,
        grams: food.servingGrams,
      },
    ]);
  };

  const updateFoodGrams = (index: number, grams: number) => {
    setSelectedFoods((current) =>
      current.map((food, foodIndex) =>
        foodIndex === index ? { ...food, grams: Math.max(1, grams) } : food
      )
    );
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end"
        >
          <div>
            <Badge className="mb-4 gap-2 rounded-md border-primary/25 bg-primary/10 text-primary">
              <Leaf className="h-3.5 w-3.5" />
              Goal-based nutrition
            </Badge>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
              Nutrition Hub
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Calories, macros, meal ideas, and grocery-friendly food structure tuned for your current {getGoalLabel(userGoal)} goal.
            </p>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-primary/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Daily target</p>
                  <p className="mt-2 text-4xl font-black text-primary">{calculator.goalCalories}</p>
                  <p className="text-xs text-muted-foreground">calories for {getGoalLabel(userGoal)}</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-background/80">
                  <Target className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Meal calories', value: totals.calories, suffix: 'cal', icon: Flame, tone: 'text-orange-400' },
            { label: 'Protein', value: totals.protein, suffix: 'g', icon: Beef, tone: 'text-emerald-400' },
            { label: 'Carbs', value: totals.carbs, suffix: 'g', icon: Wheat, tone: 'text-amber-400' },
            { label: 'Fat', value: totals.fat, suffix: 'g', icon: Droplets, tone: 'text-sky-400' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-muted', stat.tone)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-2xl font-black">
                    {stat.value}
                    <span className="ml-1 text-sm text-muted-foreground">{stat.suffix}</span>
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="planner" className="space-y-6">
          <TabsList className="grid h-11 w-full max-w-2xl grid-cols-4 rounded-lg">
            <TabsTrigger value="planner" className="gap-1 rounded-md px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <Utensils className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Meals</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-1 rounded-md px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <ShoppingBasket className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="macros" className="gap-1 rounded-md px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <Scale className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Macros</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-1 rounded-md px-1 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <Calculator className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Calc</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="space-y-6">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((category, index) => {
              const meta = categoryMeta[category];
              const Icon = meta.icon;
              const meals = mealPlans.filter((meal) => meal.category === category);

              return (
                <motion.section
                  key={category}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-black uppercase">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.bg, meta.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {meta.label}
                    </h2>
                    <Badge variant="outline" className="rounded-md">{meals.length} ideas</Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {meals.map((meal) => (
                      <Card key={meal.id} className="group overflow-hidden border-border/50 transition-all hover:border-primary/35 hover:shadow-lg">
                        <CardContent className="p-5">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-black uppercase group-hover:text-primary">{meal.name}</h3>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{meal.description}</p>
                            </div>
                            <Badge className="shrink-0 rounded-md bg-primary text-primary-foreground">
                              {meal.calories} cal
                            </Badge>
                          </div>

                          <div className="mb-4 grid grid-cols-3 gap-2">
                            {[
                              { label: 'P', value: meal.protein, color: 'text-emerald-400' },
                              { label: 'C', value: meal.carbs, color: 'text-amber-400' },
                              { label: 'F', value: meal.fat, color: 'text-sky-400' },
                            ].map((macro) => (
                              <div key={macro.label} className="rounded-lg bg-muted/45 p-2 text-center">
                                <p className={cn('text-sm font-black', macro.color)}>{macro.value}g</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">{macro.label}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {meal.ingredients.map((ingredient) => (
                              <Badge key={ingredient} variant="outline" className="rounded-md text-[10px]">
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </TabsContent>

          <TabsContent value="builder">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base uppercase">
                    <ShoppingBasket className="h-4 w-4 text-primary" />
                    Meal Customizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={foodSearch}
                      onChange={(event) => setFoodSearch(event.target.value)}
                      placeholder="Search foods or local staples..."
                      className="h-11 rounded-lg pl-10"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {foodMatches.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => addFood(food)}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{food.name}</p>
                          <p className="text-xs text-muted-foreground">{food.servingSize} - {food.calories} cal</p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {selectedFoods.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Add foods to build a custom meal and generate a shopping list.
                      </div>
                    ) : (
                      selectedFoods.map((food, index) => {
                        const scaled = scaleFood(food);
                        return (
                          <div key={`${food.id}-${index}`} className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_120px_auto] sm:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{food.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {scaled.calories} cal - P {scaled.protein}g / C {scaled.carbs}g / F {scaled.fat}g
                              </p>
                            </div>
                            <Input
                              type="number"
                              min={1}
                              value={food.grams}
                              onChange={(event) => updateFoodGrams(index, Number(event.target.value))}
                              className="h-10 rounded-lg"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedFoods((current) => current.filter((_, foodIndex) => foodIndex !== index))}
                              className="rounded-lg text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base uppercase">
                      <Calculator className="h-4 w-4 text-primary" />
                      Custom Meal Totals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Calories', value: builderTotals.calories, suffix: 'cal' },
                      { label: 'Protein', value: builderTotals.protein, suffix: 'g' },
                      { label: 'Carbs', value: builderTotals.carbs, suffix: 'g' },
                      { label: 'Fat', value: builderTotals.fat, suffix: 'g' },
                    ].map((total) => (
                      <div key={total.label} className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-2xl font-black">{total.value}<span className="ml-1 text-sm text-muted-foreground">{total.suffix}</span></p>
                        <p className="text-xs font-bold uppercase text-muted-foreground">{total.label}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base uppercase">
                      <ShoppingBasket className="h-4 w-4 text-primary" />
                      Shopping List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {shoppingList.map((item) => (
                        <div key={item} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="macros">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base uppercase">
                    <Scale className="h-4 w-4 text-primary" />
                    Target Macros
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={macroDistribution} dataKey="value" innerRadius={56} outerRadius={86} strokeWidth={0}>
                          {macroDistribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'oklch(0.17 0.012 95)',
                            border: '1px solid oklch(1 0 0 / 12%)',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(_, name) => {
                            const macro = macroDistribution.find((item) => item.name === name);
                            return [`${macro?.grams ?? 0}g`, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {macroDistribution.map((macro) => {
                      const percent = Math.round((macro.value / calculator.goalCalories) * 100);
                      return (
                        <div key={macro.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold">{macro.name}</span>
                            <span className="text-muted-foreground">{macro.grams}g / {percent}%</span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base uppercase">
                    <ShoppingBasket className="h-4 w-4 text-primary" />
                    Simple Food Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    'Protein at every meal',
                    'Carbs around training',
                    'Vegetables twice per day',
                    'Water before caffeine',
                    'Repeat meals that work',
                    'Adjust calories slowly',
                  ].map((rule) => (
                    <div key={rule} className="rounded-lg border bg-muted/20 p-4 text-sm font-semibold">
                      {rule}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            <Card className="mx-auto max-w-3xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase">
                  <Calculator className="h-4 w-4 text-primary" />
                  Calorie Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as const).map((item) => (
                        <Button
                          key={item}
                          variant={gender === item ? 'default' : 'outline'}
                          onClick={() => setGender(item)}
                          className="rounded-lg capitalize"
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" value={age} onChange={(event) => setAge(event.target.value)} className="h-11 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Profile</Label>
                    <div className="flex h-11 items-center rounded-lg border bg-muted/35 px-3 text-sm">
                      {userWeight}kg / {userHeight}cm
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Activity</Label>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {activityLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setActivityLevel(level.value)}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-colors',
                          activityLevel === level.value
                            ? 'border-primary/50 bg-primary text-primary-foreground'
                            : 'border-border bg-muted/20 hover:border-primary/40'
                        )}
                      >
                        <p className="text-sm font-black">{level.label}</p>
                        <p className="text-xs opacity-75">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'BMR', value: calculator.bmr },
                    { label: 'TDEE', value: calculator.tdee },
                    { label: 'Target', value: calculator.goalCalories },
                  ].map((result) => (
                    <div key={result.label} className="rounded-lg border bg-muted/25 p-4 text-center">
                      <p className="text-3xl font-black">{result.value}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{result.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
