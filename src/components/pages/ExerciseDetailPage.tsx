'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { exercises } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Clock, Flame, Heart, ChevronRight,
  Dumbbell, Target, Lightbulb, Trophy,
  BarChart3, Calendar, CirclePause, ListChecks, PlayCircle, Plus, Save, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { WorkoutLog } from '@/lib/store';

const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

type QuickSet = {
  reps: number;
  weight: number;
};

export function ExerciseDetailPage() {
  const { selectedExerciseId, navigate, favorites, toggleFavorite, workoutLogs, setWorkoutLogs, upsertWorkoutLog, addWorkoutLog } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'instructions' | 'tips' | 'history'>('instructions');
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [quickLog, setQuickLog] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    notes: '',
    sets: [{ reps: 10, weight: 0 }] as QuickSet[],
  });

  const exercise = exercises.find((e) => e.id === selectedExerciseId);

  useEffect(() => {
    setMediaPlaying(false);
  }, [selectedExerciseId]);

  useEffect(() => {
    let mounted = true;

    fetch('/api/workout-sessions')
      .then(async (response) => {
        const data = (await response.json()) as { success: boolean; error?: string; workoutLogs?: WorkoutLog[] };
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not load workout history');
        if (mounted && data.workoutLogs) setWorkoutLogs(data.workoutLogs);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [setWorkoutLogs]);

  if (!exercise) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Exercise not found</h3>
          <Button onClick={() => navigate('workouts')} className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.includes(exercise.id);
  const hasAnimatedMedia = Boolean(exercise.gif);
  const isAnimatedMedia = mediaPlaying && hasAnimatedMedia;
  const mediaSrc = isAnimatedMedia && exercise.gif ? exercise.gif : exercise.image;
  const exerciseHistory = workoutLogs
    .flatMap((log) =>
      log.exercises
        .filter((entry) => entry.exerciseId === exercise.id)
        .map((entry) => ({
          logId: log.id,
          date: log.date,
          workoutName: log.name,
          completed: log.completed,
          sets: entry.sets,
          volume: entry.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
          bestWeight: Math.max(0, ...entry.sets.map((set) => set.weight)),
          bestReps: Math.max(0, ...entry.sets.map((set) => set.reps)),
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const bestWeight = Math.max(0, ...exerciseHistory.map((entry) => entry.bestWeight));
  const bestVolume = Math.max(0, ...exerciseHistory.map((entry) => entry.volume));
  const totalTrackedSets = exerciseHistory.reduce((sum, entry) => sum + entry.sets.length, 0);

  const openLogDialog = () => {
    const defaultReps =
      exercise.difficulty === 'advanced' ? 6 : exercise.difficulty === 'intermediate' ? 8 : 12;
    setQuickLog({
      date: new Date().toISOString().split('T')[0],
      duration: exercise.duration,
      notes: '',
      sets: [{ reps: defaultReps, weight: exercise.category === 'no-equipment' ? 0 : 20 }],
    });
    setLogDialogOpen(true);
  };

  const updateSet = (index: number, field: keyof QuickSet, value: number) => {
    setQuickLog((prev) => ({
      ...prev,
      sets: prev.sets.map((set, i) => (i === index ? { ...set, [field]: value } : set)),
    }));
  };

  const addSet = () => {
    setQuickLog((prev) => ({
      ...prev,
      sets: [...prev.sets, prev.sets[prev.sets.length - 1] ?? { reps: 10, weight: 0 }],
    }));
  };

  const removeSet = (index: number) => {
    setQuickLog((prev) => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  };

  const saveQuickLog = async () => {
    const workout = {
      name: exercise.name,
      date: quickLog.date,
      duration: quickLog.duration,
      notes: quickLog.notes.trim(),
      completed: true,
      exercises: [
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: quickLog.sets.map((set) => ({
            reps: Math.max(0, set.reps),
            weight: Math.max(0, set.weight),
          })),
        },
      ],
    };

    setSavingLog(true);
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout }),
      });
      const data = (await response.json()) as { success: boolean; error?: string; workout?: WorkoutLog };
      if (!response.ok || !data.success || !data.workout) throw new Error(data.error || 'Could not save workout');

      upsertWorkoutLog(data.workout);
      setLogDialogOpen(false);
      setActiveTab('history');
      toast({
        title: 'Exercise logged',
        description: `${exercise.name} was saved to your workout history.`,
      });
    } catch (error) {
      addWorkoutLog(workout);
      setLogDialogOpen(false);
      setActiveTab('history');
      toast({
        title: 'Saved locally',
        description: error instanceof Error ? error.message : 'Workout sync failed, so this log stayed on this device.',
        variant: 'destructive',
      });
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('workouts')}
            className="mb-6 gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workouts
          </Button>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,oklch(0.23_0.014_95),oklch(0.11_0.01_95)_62%)] p-4 shadow-2xl shadow-black/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-video overflow-hidden rounded-xl bg-white shadow-inner dark:bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={mediaSrc}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.015 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {isAnimatedMedia ? (
                  <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                    <div className="relative h-[74%] w-[min(84%,34rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-black/20">
                      <Image
                        src={mediaSrc}
                        alt={exercise.name}
                        fill
                        priority
                        unoptimized
                        sizes="(min-width: 1024px) 544px, 84vw"
                        className="object-contain p-3 sm:p-4"
                      />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={mediaSrc}
                    alt={exercise.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 896px, 100vw"
                    className="object-contain p-4"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {hasAnimatedMedia && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setMediaPlaying((value) => !value)}
              aria-label={isAnimatedMedia ? `Pause ${exercise.name} animation` : `Play ${exercise.name} animation`}
              className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-2xl shadow-black/40 backdrop-blur-md transition-colors hover:bg-primary/95"
            >
              {isAnimatedMedia ? <CirclePause className="h-7 w-7" /> : <PlayCircle className="h-8 w-8" />}
            </motion.button>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex gap-2 mb-2">
                  <Badge className={cn("text-xs border", difficultyColor[exercise.difficulty])}>
                    {exercise.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-black/30 text-white border-none">
                    {exercise.category === 'no-equipment' ? 'No Equipment' : exercise.category === 'home' ? 'Home' : 'Gym'}
                  </Badge>
                </div>
                <h1 className="break-words text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                  {exercise.name}
                </h1>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleFavorite(exercise.id)}
                className="rounded-full bg-black/30 border-none hover:bg-black/50 shrink-0"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isFavorite ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </Button>
            </div>
          </div>
        </motion.div>
        {hasAnimatedMedia && (
          <p className="-mt-5 mb-8 text-xs text-muted-foreground">
            Exercise animation by ExerciseDB / AscendAPI.
          </p>
        )}

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { icon: <Clock className="h-5 w-5 text-primary" />, label: 'Duration', value: `${exercise.duration} min` },
            { icon: <Flame className="h-5 w-5 text-primary" />, label: 'Calories', value: `${exercise.calories}` },
            { icon: <Target className="h-5 w-5 text-primary" />, label: 'Target', value: exercise.muscleGroup },
            { icon: <Dumbbell className="h-5 w-5 text-primary" />, label: 'Equipment', value: exercise.equipment },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                {stat.icon}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="break-words text-sm font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          <Button onClick={openLogDialog} className="h-12 w-full rounded-xl gap-2 font-semibold neon-glow">
            <Plus className="h-4 w-4" />
            Log This Exercise
          </Button>
        </motion.div>

        {/* Tracking History Summary */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {[
            { icon: <Calendar className="h-5 w-5 text-primary" />, label: 'Logged', value: `${exerciseHistory.length}x` },
            { icon: <ListChecks className="h-5 w-5 text-primary" />, label: 'Tracked Sets', value: `${totalTrackedSets}` },
            { icon: <Trophy className="h-5 w-5 text-primary" />, label: 'Best Weight', value: bestWeight > 0 ? `${bestWeight}kg` : '-' },
            { icon: <BarChart3 className="h-5 w-5 text-primary" />, label: 'Best Volume', value: bestVolume > 0 ? `${bestVolume}kg` : '-' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                {stat.icon}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="break-words text-sm font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Description */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-muted-foreground leading-relaxed">
            {exercise.description}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'instructions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('instructions')}
              className="rounded-xl gap-2"
            >
              <Target className="h-4 w-4" />
              Step-by-Step
            </Button>
            <Button
              variant={activeTab === 'tips' ? 'default' : 'outline'}
              onClick={() => setActiveTab('tips')}
              className="rounded-xl gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Pro Tips
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              onClick={() => setActiveTab('history')}
              className="rounded-xl gap-2"
            >
              <Trophy className="h-4 w-4" />
              History
            </Button>
          </div>

          {activeTab === 'instructions' && (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  How to Perform
                </h3>
                <div className="space-y-4">
                  {exercise.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 items-start"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tips' && (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  {exercise.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10"
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Exercise History
                </h3>
                {exerciseHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <Dumbbell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No history yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Log this exercise from the Workouts page to track progress here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exerciseHistory.slice(0, 8).map((entry) => (
                      <div key={`${entry.logId}-${entry.date}`} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-sm">{entry.workoutName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.completed && (
                              <Badge className="h-5 border-primary/20 bg-primary/10 text-primary text-[10px]">Complete</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{entry.volume}kg volume</Badge>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {entry.sets.map((set, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-xs">
                              <span className="font-medium text-muted-foreground">Set {i + 1}</span>
                              <span>{set.weight}kg x {set.reps} reps</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            onClick={() => navigate('ai-coach')}
            className="flex-1 h-12 rounded-xl gap-2 neon-glow font-semibold"
          >
            Ask AI Coach About This Exercise
          </Button>
          <Button
            onClick={openLogDialog}
            className="flex-1 h-12 rounded-xl gap-2 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Log This Exercise
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('workouts')}
            className="flex-1 h-12 rounded-xl gap-2 font-semibold"
          >
            Browse More Exercises
          </Button>
        </div>
      </div>

      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Log Exercise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-primary/10 bg-muted/30 p-3">
              <p className="font-semibold">{exercise.name}</p>
              <p className="text-sm text-muted-foreground">
                {exercise.muscleGroup} - {exercise.equipment}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={quickLog.date}
                  onChange={(e) => setQuickLog({ ...quickLog, date: e.target.value })}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration</Label>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={quickLog.duration || ''}
                  onChange={(e) => setQuickLog({ ...quickLog, duration: Number(e.target.value) })}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Sets</Label>
                <Button variant="ghost" size="sm" onClick={addSet} className="h-8 rounded-lg gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Set
                </Button>
              </div>
              <div className="space-y-2">
                {quickLog.sets.map((set, index) => (
                  <div key={index} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground text-center">S{index + 1}</span>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={set.weight || ''}
                        onChange={(e) => updateSet(index, 'weight', Number(e.target.value))}
                        className="h-10 rounded-lg pr-8"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">kg</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={set.reps || ''}
                        onChange={(e) => updateSet(index, 'reps', Number(e.target.value))}
                        className="h-10 rounded-lg pr-10"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">reps</span>
                    </div>
                    <button
                      onClick={() => removeSet(index)}
                      disabled={quickLog.sets.length === 1}
                      className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Remove set"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={quickLog.notes}
                onChange={(e) => setQuickLog({ ...quickLog, notes: e.target.value })}
                placeholder="How did this set feel?"
                className="min-h-[70px] rounded-lg resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={saveQuickLog} className="rounded-xl gap-2" disabled={savingLog}>
              <Save className="h-4 w-4" />
              {savingLog ? 'Saving...' : 'Save Workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
