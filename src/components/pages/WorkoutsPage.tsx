'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { exercises } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  Search, SlidersHorizontal, Dumbbell, Home, Clock,
  Flame, Heart, X, Plus, Save, Trash2, ListChecks,
  Calendar, BarChart3, Trophy, NotebookPen, PlayCircle,
  ArrowDownAZ, Filter, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/lib/data';
import type { WorkoutLog } from '@/lib/store';

type QuickSet = {
  reps: number;
  weight: number;
};

const categories = [
  { id: 'all', label: 'All', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { id: 'no-equipment', label: 'No Equipment', icon: <Clock className="h-4 w-4" /> },
] as const;

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;

const sortOptions = [
  { value: 'popular', label: 'Recommended' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'duration', label: 'Shortest first' },
  { value: 'calories', label: 'Highest burn' },
  { value: 'difficulty', label: 'Difficulty' },
] as const;

const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

export function WorkoutsPage() {
  const {
    setExerciseId,
    favorites,
    toggleFavorite,
    navigate,
    workoutLogs,
    setWorkoutLogs,
    upsertWorkoutLog,
    addWorkoutLog,
  } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [savedOnly, setSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [quickLog, setQuickLog] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    notes: '',
    sets: [{ reps: 10, weight: 0 }] as QuickSet[],
  });

  const muscleGroups = Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).sort();
  const equipmentOptions = Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort();
  const difficultyRank: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

  useEffect(() => {
    let mounted = true;

    fetch('/api/workout-sessions')
      .then(async (response) => {
        const data = (await response.json()) as { success: boolean; error?: string; workoutLogs?: WorkoutLog[] };
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not load workout history');
        if (mounted && data.workoutLogs) setWorkoutLogs(data.workoutLogs);
      })
      .catch((error) => {
        if (!mounted) return;
        toast({
          title: 'Could not sync workouts',
          description: error instanceof Error ? error.message : 'Your local history is still available.',
          variant: 'destructive',
        });
      });

    return () => {
      mounted = false;
    };
  }, [setWorkoutLogs, toast]);

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
    const matchMuscle = selectedMuscle === 'all' || ex.muscleGroup === selectedMuscle;
    const matchEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    const matchSaved = !savedOnly || favorites.includes(ex.id);
    return matchSearch && matchCategory && matchDifficulty && matchMuscle && matchEquipment && matchSaved;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'duration') return a.duration - b.duration;
    if (sortBy === 'calories') return b.calories - a.calories;
    if (sortBy === 'difficulty') return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
    return getLoggedCount(b.id) - getLoggedCount(a.id) || b.calories - a.calories;
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedMuscle('all');
    setSelectedEquipment('all');
    setSavedOnly(false);
    setSortBy('popular');
  };

  const hasActiveFilters = Boolean(
    search ||
    selectedCategory !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedMuscle !== 'all' ||
    selectedEquipment !== 'all' ||
    savedOnly ||
    sortBy !== 'popular'
  );
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const recentLogs = workoutLogs.slice(0, 3);
  const weeklyLogs = workoutLogs.filter((log) => new Date(`${log.date}T00:00:00`) >= sevenDaysAgo);
  const weeklyMinutes = weeklyLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalSets = workoutLogs.reduce(
    (sum, log) => sum + log.exercises.reduce((exerciseSum, ex) => exerciseSum + ex.sets.length, 0),
    0
  );
  const totalVolume = workoutLogs.reduce(
    (sum, log) =>
      sum +
      log.exercises.reduce(
        (exerciseSum, ex) => exerciseSum + ex.sets.reduce((setSum, set) => setSum + set.reps * set.weight, 0),
        0
      ),
    0
  );

  function getLoggedCount(exerciseId: string) {
    return workoutLogs.filter((log) => log.exercises.some((ex) => ex.exerciseId === exerciseId)).length;
  }

  const openLogDialog = (exercise: Exercise) => {
    const defaultReps =
      exercise.difficulty === 'advanced' ? 6 : exercise.difficulty === 'intermediate' ? 8 : 12;
    setSelectedExercise(exercise);
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
    if (!selectedExercise || quickLog.sets.length === 0) return;

    const workout = {
      name: selectedExercise.name,
      date: quickLog.date,
      duration: quickLog.duration,
      notes: quickLog.notes.trim(),
      completed: true,
      exercises: [
        {
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
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
      toast({
        title: 'Workout tracked',
        description: `${selectedExercise.name} was saved to your workout history.`,
      });
    } catch (error) {
      addWorkoutLog(workout);
      setLogDialogOpen(false);
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Workout <span className="gradient-text">Library</span>
          </h1>
          <p className="text-muted-foreground">
            Browse {exercises.length}+ exercises, log sets, and track your progress
          </p>
        </motion.div>

        {/* Tracking Summary */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {[
            { icon: <Calendar className="h-4 w-4" />, label: 'This Week', value: `${weeklyLogs.length}`, sub: 'tracked workouts' },
            { icon: <Clock className="h-4 w-4" />, label: 'Minutes', value: `${weeklyMinutes}`, sub: 'last 7 days' },
            { icon: <ListChecks className="h-4 w-4" />, label: 'Sets', value: `${totalSets}`, sub: 'all time' },
            { icon: <BarChart3 className="h-4 w-4" />, label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()}kg`, sub: 'all time' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-[11px] text-muted-foreground/70">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {recentLogs.length > 0 && (
          <motion.div
            className="mb-8 rounded-xl border border-border/50 bg-card/60 p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Recent Tracking
                </h2>
                <p className="text-sm text-muted-foreground">Your latest logged workouts stay one click away.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('dashboard')} className="rounded-lg gap-2">
                <NotebookPen className="h-4 w-4" />
                Full History
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{log.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`${log.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{log.duration}m</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {log.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets logged
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises by name or muscle group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 rounded-xl gap-2",
                showFilters && "bg-primary/10 text-primary border-primary/20"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-lg gap-2 shrink-0 transition-all",
                  selectedCategory === cat.id && "neon-glow"
                )}
              >
                {cat.icon}
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Difficulty Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-muted-foreground">
                    <Filter className="h-4 w-4 text-primary" />
                    Fast filters
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Muscle group</Label>
                      <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All muscles</SelectItem>
                          {muscleGroups.map((group) => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Equipment</Label>
                      <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any equipment</SelectItem>
                          {equipmentOptions.map((equipment) => (
                            <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((difficulty) => (
                            <SelectItem key={difficulty} value={difficulty} className="capitalize">
                              {difficulty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Sort by</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant={savedOnly ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSavedOnly((value) => !value)}
                      className="rounded-lg gap-2"
                    >
                      <Star className={cn('h-3.5 w-3.5', savedOnly && 'fill-current')} />
                      Saved only
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="rounded-lg text-muted-foreground gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownAZ className="h-3.5 w-3.5" />
            Sorted by {sortOptions.find((option) => option.value === sortBy)?.label || 'Recommended'}
          </p>
        </div>

        {/* Exercise Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((exercise, i) => (
              <motion.div
                key={exercise.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50">
                  <div
                    className="relative aspect-video bg-cover bg-center"
                    style={{ backgroundImage: `url('${exercise.image}')` }}
                    onClick={() => setExerciseId(exercise.id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={cn("text-xs border", difficultyColor[exercise.difficulty])}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(exercise.id);
                      }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          favorites.includes(exercise.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white"
                        )}
                      />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white text-sm leading-tight drop-shadow-lg">
                        {exercise.name}
                      </h3>
                      {getLoggedCount(exercise.id) > 0 && (
                        <p className="mt-1 text-xs text-white/80 drop-shadow-lg">
                          Logged {getLoggedCount(exercise.id)} time{getLoggedCount(exercise.id) > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exercise.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {exercise.calories} cal
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {exercise.muscleGroup}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExerciseId(exercise.id)}
                        className="rounded-lg"
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuideExercise(exercise)}
                        className="rounded-lg gap-1.5"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Guide
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openLogDialog(exercise)}
                        className="rounded-lg gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Log
                      </Button>
                    </div>
                    <Button
                      variant={favorites.includes(exercise.id) ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => toggleFavorite(exercise.id)}
                      className="mt-2 w-full rounded-lg gap-2"
                    >
                      <Heart className={cn('h-3.5 w-3.5', favorites.includes(exercise.id) && 'fill-red-500 text-red-500')} />
                      {favorites.includes(exercise.id) ? 'Saved workout' : 'Save workout'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Dialog open={Boolean(guideExercise)} onOpenChange={(open) => !open && setGuideExercise(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Exercise Guidance
            </DialogTitle>
          </DialogHeader>

          {guideExercise && (
            <div className="space-y-5">
              <div
                className="relative aspect-video overflow-hidden rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url('${guideExercise.image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                    <PlayCircle className="h-8 w-8" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-black uppercase text-white drop-shadow">{guideExercise.name}</p>
                  <p className="text-sm text-white/75 drop-shadow">{guideExercise.muscleGroup} - {guideExercise.equipment}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/25 p-4">
                  <p className="mb-3 text-xs font-black uppercase text-muted-foreground">Form cues</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {guideExercise.steps.slice(0, 4).map((step) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border bg-muted/25 p-4">
                  <p className="mb-3 text-xs font-black uppercase text-muted-foreground">Coach tips</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {guideExercise.tips.slice(0, 4).map((tip) => (
                      <li key={tip} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Log Exercise
            </DialogTitle>
          </DialogHeader>

          {selectedExercise && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="font-semibold">{selectedExercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedExercise.muscleGroup} - {selectedExercise.equipment}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={quickLog.date}
                    onChange={(e) => setQuickLog({ ...quickLog, date: e.target.value })}
                    className="h-9 rounded-lg"
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
                    className="h-9 rounded-lg"
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
                          className="h-9 rounded-lg pr-8"
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
                          className="h-9 rounded-lg pr-10"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">reps</span>
                      </div>
                      <button
                        onClick={() => removeSet(index)}
                        disabled={quickLog.sets.length === 1}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 disabled:pointer-events-none"
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
          )}

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
