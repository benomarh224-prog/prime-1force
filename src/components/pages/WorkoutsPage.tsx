'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  ArrowDownAZ, Filter, Star, CheckCircle2, CalendarCheck2,
  CirclePause, Loader2, RefreshCw, Target, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/lib/data';
import type { WorkoutLog } from '@/lib/store';
import { FutureShell, GlassPanel, MetricCard, SectionHeading, TiltCard } from '@/components/future/FutureUI';
import { FutureScene } from '@/components/future/FutureScene';

type QuickSet = {
  reps: number;
  weight: number;
};

type SessionSet = QuickSet & {
  done: boolean;
};

type SessionExercise = {
  exerciseId: string;
  exerciseName: string;
  sourceExercise?: Exercise;
  sets: SessionSet[];
  done: boolean;
};

type ScheduleDay = {
  id?: string;
  dayOfWeek: number;
  dayName: string;
  splitTitle: string;
  exercises: string[];
  notes: string | null;
  isRestDay: boolean;
};

type TodaySchedule = ScheduleDay & {
  date: string;
  completed: boolean;
  completionId: string | null;
};

type ScheduleResponse = {
  success: boolean;
  error?: string;
  activeProgram?: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  } | null;
  today?: TodaySchedule | null;
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

const plannedFocusMap: Record<string, string[]> = {
  chest: ['Barbell Bench Press', 'Chest Press Machine'],
  shoulders: ['Shoulder Press Machine'],
  triceps: ['Cable Triceps Pushdown'],
  back: ['Lat Pulldown Machine', 'Seated Row Machine'],
  biceps: ['Machine Bicep Curl'],
  'rear delts': ['Seated Row Machine'],
  core: ['Barbell Back Squat', 'Seated Row Machine'],
  abs: ['Barbell Back Squat', 'Seated Row Machine'],
  quads: ['Barbell Back Squat', 'Leg Extension Machine'],
  hamstrings: ['Barbell Back Squat', 'Leg Extension Machine'],
  glutes: ['Barbell Back Squat'],
  calves: ['Leg Extension Machine'],
  legs: ['Barbell Back Squat', 'Leg Extension Machine'],
  cardio: ['Barbell Back Squat', 'Lat Pulldown Machine'],
};

const sessionPrepItems = [
  '5 min easy warm-up',
  'One light ramp-up set',
  'Phone on timer mode',
];

function getDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function defaultRepsForExercise(exercise?: Exercise) {
  if (!exercise) return 10;
  if (exercise.difficulty === 'advanced') return 6;
  if (exercise.difficulty === 'intermediate') return 8;
  return 12;
}

function defaultWeightForExercise(exercise?: Exercise) {
  if (!exercise || exercise.category === 'no-equipment') return 0;
  return 20;
}

function getExerciseMedia(exercise: Exercise, playing = false) {
  const kind = playing && exercise.video
    ? 'video'
    : playing && exercise.gif
      ? 'gif'
      : 'image';

  return {
    src: kind === 'video'
      ? exercise.video ?? exercise.image
      : kind === 'gif'
        ? exercise.gif ?? exercise.image
        : exercise.image,
    kind,
    animated: kind === 'gif',
    playable: Boolean(exercise.video || exercise.gif),
  };
}

export function WorkoutsPage() {
  const {
    setExerciseId,
    pendingStartExerciseId,
    pendingStartTodayWorkout,
    clearPendingStartExercise,
    clearPendingStartTodayWorkout,
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
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionShouldCompleteToday, setSessionShouldCompleteToday] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionPrepChecks, setSessionPrepChecks] = useState(sessionPrepItems.map(() => false));
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRunning, setRestRunning] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [syncingCompletion, setSyncingCompletion] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState('');
  const [activeProgramName, setActiveProgramName] = useState('');
  const [todayPlan, setTodayPlan] = useState<TodaySchedule | null>(null);
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  const [guideMediaPlaying, setGuideMediaPlaying] = useState(false);
  const [playingMediaIds, setPlayingMediaIds] = useState<Record<string, boolean>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const todayDateKey = getDateKey();
  const [quickLog, setQuickLog] = useState({
    date: todayDateKey,
    duration: 0,
    notes: '',
    sets: [{ reps: 10, weight: 0 }] as QuickSet[],
  });

  const muscleGroups = Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).sort();
  const equipmentOptions = Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort();
  const difficultyRank: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

  const loadTodaySchedule = async (showSuccessToast = false) => {
    setScheduleLoading(true);
    try {
      const response = await fetch('/api/schedule');
      const data = (await response.json()) as ScheduleResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load schedule');

      setActiveProgramId(data.activeProgram?.id || '');
      setActiveProgramName(data.activeProgram?.name || '');
      setTodayPlan(data.today || null);

      if (showSuccessToast) {
        toast({ title: 'Plan refreshed', description: 'Today\'s workout status is up to date.' });
      }
    } catch (error) {
      toast({
        title: 'Could not load today plan',
        description: error instanceof Error ? error.message : 'You can still log workouts manually.',
        variant: 'destructive',
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadWorkoutHistory = async () => {
      try {
        const response = await fetch('/api/workout-sessions');
        const data = (await response.json()) as { success: boolean; error?: string; workoutLogs?: WorkoutLog[] };
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not load workout history');
        if (mounted && data.workoutLogs) setWorkoutLogs(data.workoutLogs);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: 'Could not sync workouts',
          description: error instanceof Error ? error.message : 'Your local history is still available.',
          variant: 'destructive',
        });
      }
    };

    loadWorkoutHistory();
    loadTodaySchedule();

    return () => {
      mounted = false;
    };
  }, [setWorkoutLogs, toast]);

  useEffect(() => {
    if (!sessionOpen || !sessionStartedAt) return undefined;

    const interval = window.setInterval(() => {
      setSessionElapsed(Math.floor((Date.now() - sessionStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sessionOpen, sessionStartedAt]);

  useEffect(() => {
    if (!sessionOpen || !restRunning) return undefined;
    if (restSeconds <= 0) {
      setRestRunning(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setRestSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [restRunning, restSeconds, sessionOpen]);

  useEffect(() => {
    setGuideMediaPlaying(false);
  }, [guideExercise?.id]);

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
  const todayLogged = workoutLogs.some((log) => log.date === todayDateKey);
  const todayStatus = todayPlan?.isRestDay
    ? 'Rest'
    : todayPlan?.completed
      ? 'Complete'
      : todayLogged
        ? 'Logged'
        : 'Planned';
  const sessionSetCount = sessionExercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const sessionDoneSetCount = sessionExercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0
  );
  const sessionProgress = sessionSetCount > 0 ? Math.round((sessionDoneSetCount / sessionSetCount) * 100) : 0;
  const sessionVolume = sessionExercises.reduce(
    (sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + set.reps * set.weight, 0),
    0
  );
  const completedSessionVolume = sessionExercises.reduce(
    (sum, exercise) => sum + exercise.sets
      .filter((set) => set.done)
      .reduce((setSum, set) => setSum + set.reps * set.weight, 0),
    0
  );
  const activeSessionExerciseIndex = sessionExercises.findIndex((exercise) => !exercise.done);
  const activeSessionExercise = activeSessionExerciseIndex >= 0
    ? sessionExercises[activeSessionExerciseIndex]
    : sessionExercises[sessionExercises.length - 1] || null;
  const activeSessionSetIndex = activeSessionExerciseIndex >= 0
    ? sessionExercises[activeSessionExerciseIndex]?.sets.findIndex((set) => !set.done) ?? -1
    : -1;
  const nextSessionExercise = activeSessionExerciseIndex >= 0
    ? sessionExercises.slice(activeSessionExerciseIndex + 1).find((exercise) => !exercise.done) || null
    : null;
  const remainingSetCount = Math.max(sessionSetCount - sessionDoneSetCount, 0);
  const estimatedRemainingMinutes = Math.max(
    remainingSetCount * 2 + sessionExercises.filter((exercise) => !exercise.done).length * 3,
    sessionOpen && sessionExercises.length > 0 && sessionProgress < 100 ? 3 : 0
  );
  const sessionSignal = sessionProgress >= 100
    ? 'Complete'
    : restRunning
      ? 'Recover'
      : sessionProgress >= 65
        ? 'Finish strong'
        : sessionDoneSetCount > 0
          ? 'Build rhythm'
          : 'First set';

  function getLoggedCount(exerciseId: string) {
    return workoutLogs.filter((log) => log.exercises.some((ex) => ex.exerciseId === exerciseId)).length;
  }

  const findExercise = (name: string) => {
    const normalized = name.toLowerCase().trim();
    return exercises.find((exercise) => exercise.name.toLowerCase() === normalized)
      || exercises.find((exercise) => exercise.name.toLowerCase().includes(normalized) || normalized.includes(exercise.name.toLowerCase()));
  };

  const getSessionSwaps = (exercise?: Exercise) => {
    if (!exercise) return [];

    const sameMuscle = exercises.filter((candidate) =>
      candidate.id !== exercise.id &&
      candidate.muscleGroup === exercise.muscleGroup
    );
    const sameCategory = exercises.filter((candidate) =>
      candidate.id !== exercise.id &&
      candidate.category === exercise.category &&
      !sameMuscle.some((swap) => swap.id === candidate.id)
    );

    return [...sameMuscle, ...sameCategory].slice(0, 3);
  };

  const makeSessionExercise = (name: string, fallbackIndex = 0): SessionExercise => {
    const sourceExercise = findExercise(name);
    const reps = defaultRepsForExercise(sourceExercise);
    const weight = defaultWeightForExercise(sourceExercise);

    return {
      exerciseId: sourceExercise?.id || `session-${fallbackIndex}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      exerciseName: sourceExercise?.name || name,
      sourceExercise,
      sets: Array.from({ length: 3 }, () => ({ reps, weight, done: false })),
      done: false,
    };
  };

  const swapSessionExercise = (exerciseIndex: number, nextExercise: Exercise) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;

        const reps = defaultRepsForExercise(nextExercise);
        const weight = defaultWeightForExercise(nextExercise);
        const setCount = Math.max(exercise.sets.length, 1);

        return {
          exerciseId: nextExercise.id,
          exerciseName: nextExercise.name,
          sourceExercise: nextExercise,
          sets: Array.from({ length: setCount }, () => ({ reps, weight, done: false })),
          done: false,
        };
      })
    );
  };

  const expandPlannedExercises = (plannedExercises: string[]) =>
    plannedExercises.flatMap((name) => plannedFocusMap[name.toLowerCase().trim()] || [name]);

  const startSession = (mode: 'today' | 'exercise', exercise?: Exercise) => {
    if (mode === 'today') {
      if (!todayPlan || todayPlan.isRestDay || todayPlan.exercises.length === 0) return;

      setSessionName(todayPlan.splitTitle);
      setSessionNotes(todayPlan.notes || '');
      setSessionExercises(expandPlannedExercises(todayPlan.exercises).map((name, index) => makeSessionExercise(name, index)));
      setSessionShouldCompleteToday(true);
    } else if (exercise) {
      setSessionName(exercise.name);
      setSessionNotes('');
      setSessionExercises([makeSessionExercise(exercise.name)]);
      setSessionShouldCompleteToday(false);
    }

    setRestSeconds(90);
    setRestRunning(false);
    setSessionPrepChecks(sessionPrepItems.map(() => false));
    setSessionElapsed(0);
    setSessionStartedAt(Date.now());
    setSessionOpen(true);
  };

  useEffect(() => {
    if (!pendingStartExerciseId) return;

    const exerciseToStart = exercises.find((exercise) => exercise.id === pendingStartExerciseId);
    clearPendingStartExercise();
    if (exerciseToStart) {
      startSession('exercise', exerciseToStart);
    }
  }, [clearPendingStartExercise, pendingStartExerciseId]);

  useEffect(() => {
    if (!pendingStartTodayWorkout || scheduleLoading) return;

    clearPendingStartTodayWorkout();
    if (todayPlan && !todayPlan.isRestDay && todayPlan.exercises.length > 0) {
      startSession('today');
      return;
    }

    toast({
      title: todayPlan?.isRestDay ? 'Today is a rest day' : 'No workout planned yet',
      description: todayPlan?.isRestDay
        ? todayPlan.notes || 'Use Schedule to plan the next training day.'
        : 'Build a weekly plan in Schedule, or start any exercise from the library below.',
    });
  }, [clearPendingStartTodayWorkout, pendingStartTodayWorkout, scheduleLoading, todayPlan, toast]);

  const updateSessionSet = (exerciseIndex: number, setIndex: number, field: keyof QuickSet, value: number) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [field]: Math.max(0, value) } : set
              ),
            }
          : exercise
      )
    );
  };

  const toggleSessionSet = (exerciseIndex: number, setIndex: number) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;

        const sets = exercise.sets.map((set, currentSetIndex) =>
          currentSetIndex === setIndex ? { ...set, done: !set.done } : set
        );

        return {
          ...exercise,
          sets,
          done: sets.every((set) => set.done),
        };
      })
    );

    setRestSeconds(90);
    setRestRunning(true);
  };

  const toggleSessionPrep = (prepIndex: number) => {
    setSessionPrepChecks((current) =>
      current.map((checked, currentIndex) => currentIndex === prepIndex ? !checked : checked)
    );
  };

  const completeNextSessionSet = () => {
    if (activeSessionExerciseIndex < 0 || activeSessionSetIndex < 0) return;
    toggleSessionSet(activeSessionExerciseIndex, activeSessionSetIndex);
  };

  const toggleSessionExercise = (exerciseIndex: number) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;

        const done = !exercise.done;
        return {
          ...exercise,
          done,
          sets: exercise.sets.map((set) => ({ ...set, done })),
        };
      })
    );
  };

  const addSessionSet = (exerciseIndex: number) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  reps: exercise.sets[exercise.sets.length - 1]?.reps ?? 10,
                  weight: exercise.sets[exercise.sets.length - 1]?.weight ?? 0,
                  done: false,
                },
              ],
              done: false,
            }
          : exercise
      )
    );
  };

  const removeSessionSet = (exerciseIndex: number, setIndex: number) => {
    setSessionExercises((current) =>
      current.map((exercise, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex),
              done: false,
            }
          : exercise
      )
    );
  };

  const setTodayCompletion = async (completed: boolean, options: { silent?: boolean } = {}) => {
    if (!todayPlan || !activeProgramId || todayPlan.isRestDay) return false;

    setSyncingCompletion(true);
    try {
      const response = await fetch('/api/schedule/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: activeProgramId,
          dayOfWeek: todayPlan.dayOfWeek,
          date: todayDateKey,
          notes: todayPlan.notes,
          completed,
        }),
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        completed?: boolean;
        completion?: { id: string; completedAt: string } | null;
      };
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not update today');

      setTodayPlan((current) =>
        current
          ? {
              ...current,
              completed: Boolean(data.completed),
              completionId: data.completion?.id || null,
            }
          : current
      );

      if (!options.silent) {
        toast({
          title: data.completed ? 'Workout complete' : 'Workout reopened',
          description: `${todayPlan.splitTitle} is updated for ${formatDate(todayDateKey)}.`,
        });
      }

      return Boolean(data.completed);
    } catch (error) {
      if (!options.silent) {
        toast({
          title: 'Could not update today',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setSyncingCompletion(false);
    }
  };

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
      if (quickLog.date === todayDateKey && todayPlan && !todayPlan.isRestDay) {
        await setTodayCompletion(true, { silent: true });
      }
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

  const finishSession = async () => {
    if (sessionExercises.length === 0) return;

    const duration = Math.max(1, Math.round(sessionElapsed / 60));
    const workout = {
      name: sessionName.trim() || 'Workout Session',
      date: todayDateKey,
      duration,
      notes: [
        sessionNotes.trim(),
        `Session mode: ${sessionDoneSetCount}/${sessionSetCount} sets completed.`,
        restSeconds > 0 && restSeconds < 90 ? `Last rest timer stopped at ${formatTimer(restSeconds)}.` : '',
      ].filter(Boolean).join('\n'),
      completed: true,
      exercises: sessionExercises.map((exercise) => {
        const completedSets = exercise.sets.filter((set) => set.done);
        const setsToSave = completedSets.length > 0 ? completedSets : exercise.sets;

        return {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          sets: setsToSave.map((set) => ({
            reps: Math.max(0, set.reps),
            weight: Math.max(0, set.weight),
          })),
        };
      }),
    };

    setSessionSaving(true);
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout }),
      });
      const data = (await response.json()) as { success: boolean; error?: string; workout?: WorkoutLog };
      if (!response.ok || !data.success || !data.workout) throw new Error(data.error || 'Could not save workout');

      upsertWorkoutLog(data.workout);
      if (sessionShouldCompleteToday && todayPlan && !todayPlan.isRestDay) {
        await setTodayCompletion(true, { silent: true });
      }
      setSessionOpen(false);
      setRestRunning(false);
      toast({
        title: 'Workout finished',
        description: `${workout.name} was saved with ${sessionDoneSetCount || sessionSetCount} tracked sets.`,
      });
    } catch (error) {
      addWorkoutLog(workout);
      setSessionOpen(false);
      setRestRunning(false);
      toast({
        title: 'Saved locally',
        description: error instanceof Error ? error.message : 'Workout sync failed, so this session stayed on this device.',
        variant: 'destructive',
      });
    } finally {
      setSessionSaving(false);
    }
  };

  return (
    <FutureShell className="min-h-screen">
      <FutureScene variant="ambient" className="fixed opacity-28" />
      <div className="relative z-10 min-h-screen pb-10 pt-20 sm:pt-24 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading
            eyebrow="3D Exercise Lab"
            title="Workout library, rebuilt as a futuristic training cockpit."
            copy={`Browse ${exercises.length}+ exercises, preview movement patterns, launch sessions, and track every set without losing flow.`}
          />
        </motion.div>

        <motion.div
          className="mb-6 overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.055] shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:mb-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.03 }}
        >
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-4 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(0,194,255,0.16),transparent_34%)]" />
              <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/10">
                  {formatDate(todayDateKey)}
                </Badge>
                <Badge
                  variant={todayPlan?.isRestDay ? 'secondary' : todayPlan?.completed ? 'default' : 'outline'}
                  className="rounded-md"
                >
                  {todayStatus}
                </Badge>
                {activeProgramName && (
                  <Badge variant="outline" className="rounded-md">
                    {activeProgramName}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/60">Today&apos;s protocol</p>
                  <h2 className="holo-text mt-2 break-words text-2xl font-black uppercase sm:text-3xl">
                    {scheduleLoading ? 'Loading plan...' : todayPlan?.splitTitle || 'No plan selected'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                    {todayPlan?.isRestDay
                      ? todayPlan.notes || 'Recovery is part of the program. Keep it easy and come back fresh.'
                      : todayPlan?.exercises?.length
                        ? todayPlan.exercises.join(', ')
                        : 'Log a workout below or build a weekly plan in Schedule.'}
                  </p>
                </div>

                <div className="grid w-full grid-cols-[2.75rem_1fr_1fr] gap-2 sm:flex sm:w-auto sm:shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-full rounded-lg sm:w-11"
                    onClick={() => loadTodaySchedule(true)}
                    disabled={scheduleLoading}
                    aria-label="Refresh today plan"
                  >
                    <RefreshCw className={cn('h-4 w-4', scheduleLoading && 'animate-spin')} />
                  </Button>
                  <Button
                    onClick={() => setTodayCompletion(!todayPlan?.completed)}
                    disabled={scheduleLoading || syncingCompletion || !todayPlan || todayPlan.isRestDay}
                    variant={todayPlan?.completed ? 'secondary' : 'default'}
                    className="h-11 rounded-lg font-bold shadow-[0_0_28px_rgba(0,194,255,0.2)]"
                  >
                    {syncingCompletion ? <Loader2 className="h-4 w-4 animate-spin" /> : todayPlan?.isRestDay ? <CirclePause className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {todayPlan?.isRestDay ? 'Rest Day' : todayPlan?.completed ? 'Reopen' : 'Complete'}
                  </Button>
                  <Button
                    onClick={() => startSession('today')}
                    disabled={scheduleLoading || !todayPlan || todayPlan.isRestDay || todayPlan.exercises.length === 0}
                    className="h-11 rounded-lg font-bold"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start
                  </Button>
                </div>
              </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <div className="grid h-full gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                    <CalendarCheck2 className="h-4 w-4 text-primary" />
                    Schedule
                  </div>
                  <p className="mt-2 text-xl font-black">{todayPlan?.isRestDay ? 'Rest' : todayPlan?.completed ? 'Done' : 'Open'}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    Logged today
                  </div>
                  <p className="mt-2 text-xl font-black">{todayLogged ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                    <ListChecks className="h-4 w-4 text-primary" />
                    Exercises
                  </div>
                  <p className="mt-2 text-xl font-black">{todayPlan?.exercises?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tracking Summary */}
        <motion.div
          className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-8 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {[
            { icon: <Calendar className="h-4 w-4" />, label: 'This Week', value: `${weeklyLogs.length}`, detail: 'tracked workouts', tone: 'cyan' as const },
            { icon: <Clock className="h-4 w-4" />, label: 'Minutes', value: `${weeklyMinutes}`, detail: 'last 7 days', tone: 'orange' as const },
            { icon: <ListChecks className="h-4 w-4" />, label: 'Sets', value: `${totalSets}`, detail: 'all time', tone: 'green' as const },
            { icon: <BarChart3 className="h-4 w-4" />, label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()}kg`, detail: 'all time', tone: 'cyan' as const },
          ].map((stat) => (
            <MetricCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} tone={stat.tone} icon={stat.icon} />
          ))}
        </motion.div>

        {recentLogs.length > 0 && (
          <motion.div
            className="future-glass mb-8 rounded-xl border border-white/[0.12] bg-white/[0.055] p-4 backdrop-blur-2xl"
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
          className="mb-6 space-y-4 sm:mb-8"
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
                className="h-11 rounded-xl bg-card pl-10 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 rounded-xl gap-2 px-3",
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
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "h-10 shrink-0 rounded-lg gap-2 transition-all",
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
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
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
                {(() => {
                  const media = getExerciseMedia(exercise, Boolean(playingMediaIds[exercise.id]));

                  return (
                <TiltCard>
                <GlassPanel className="group h-full overflow-hidden p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    className="relative block aspect-[4/3] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,194,255,0.16),rgba(5,9,15,0.92)_62%)] p-3 text-left sm:aspect-[16/13]"
                    onClick={() => setExerciseId(exercise.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setExerciseId(exercise.id);
                      }
                    }}
                  >
                    <div className="absolute inset-x-3 top-3 bottom-14 overflow-hidden rounded-lg border border-white/10 bg-white shadow-inner shadow-black/10 dark:bg-white">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={media.src}
                          className="absolute inset-0"
                          initial={{ opacity: 0, scale: 0.985 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.015 }}
                          transition={{ duration: 0.24, ease: 'easeOut' }}
                        >
                          {media.kind === 'video' ? (
                            <video
                              src={media.src}
                              poster={exercise.image}
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <Image
                              src={media.src}
                              alt={exercise.name}
                              fill
                              unoptimized={media.animated}
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    {media.playable && media.kind === 'image' && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPlayingMediaIds((current) => ({
                            ...current,
                            [exercise.id]: true,
                          }));
                        }}
                        aria-label={`Play ${exercise.name} demo`}
                        className="absolute left-1/2 top-[42%] z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-2xl shadow-black/40 backdrop-blur-md transition-colors hover:bg-primary/95"
                      >
                        <PlayCircle className="h-7 w-7" />
                      </motion.button>
                    )}
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
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exercise.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {exercise.calories} cal
                        </span>
                      </div>
                      <Badge variant="outline" className="max-w-full text-xs">
                        {exercise.muscleGroup}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startSession('exercise', exercise)}
                      className="mt-4 h-10 w-full rounded-lg gap-1.5 font-bold"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start This Exercise
                    </Button>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExerciseId(exercise.id)}
                        className="w-full rounded-lg"
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuideExercise(exercise)}
                        className="w-full rounded-lg gap-1.5"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Guide
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openLogDialog(exercise)}
                        className="w-full rounded-lg gap-1.5"
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
                </GlassPanel>
                </TiltCard>
                  );
                })()}
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

          {guideExercise && (() => {
            const media = getExerciseMedia(guideExercise, guideMediaPlaying);

            return (
            <div className="space-y-5">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,oklch(0.23_0.014_95),oklch(0.11_0.01_95)_62%)] p-4">
                <div className="absolute inset-4 overflow-hidden rounded-lg bg-white shadow-inner dark:bg-white">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={media.src}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.015 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      {media.kind === 'video' ? (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="relative h-[82%] w-[min(90%,36rem)] overflow-hidden rounded-2xl border border-black/10 bg-black shadow-2xl shadow-black/25">
                            <video
                              src={media.src}
                              poster={guideExercise.image}
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                      ) : media.animated ? (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="relative h-[74%] w-[min(84%,30rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-black/20">
                            <Image
                              src={media.src}
                              alt={guideExercise.name}
                              fill
                              unoptimized
                              sizes="(min-width: 768px) 480px, 84vw"
                              className="object-contain p-3"
                            />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={media.src}
                          alt={guideExercise.name}
                          fill
                          sizes="(min-width: 768px) 640px, 100vw"
                          className="object-contain p-3"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {media.playable && media.kind === 'image' && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGuideMediaPlaying(true)}
                    aria-label={`Play ${guideExercise.name} demo`}
                    className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-2xl shadow-black/40 backdrop-blur-md transition-colors hover:bg-primary/95"
                  >
                    <PlayCircle className="h-8 w-8" />
                  </motion.button>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-black uppercase text-white drop-shadow">{guideExercise.name}</p>
                  <p className="text-sm text-white/75 drop-shadow">{guideExercise.muscleGroup} - {guideExercise.equipment}</p>
                </div>
              </div>
              {media.playable && (
                <p className="-mt-2 text-xs text-muted-foreground">
                  Exercise media by ExerciseDB / AscendAPI.
                </p>
              )}

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
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 border-b bg-background/95 p-4 backdrop-blur sm:p-5">
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Workout Session
                <Badge variant="outline" className="rounded-md">
                  {formatTimer(sessionElapsed)}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label className="text-xs">Session name</Label>
                <Input
                  value={sessionName}
                  onChange={(event) => setSessionName(event.target.value)}
                  className="h-11 rounded-lg font-bold"
                  placeholder="Workout Session"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/25 p-3 text-center">
                  <p className="text-lg font-black">{sessionProgress}%</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Done</p>
                </div>
                <div className="rounded-lg border bg-muted/25 p-3 text-center">
                  <p className="text-lg font-black">{sessionDoneSetCount}/{sessionSetCount}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Sets</p>
                </div>
                <div className="rounded-lg border bg-muted/25 p-3 text-center">
                  <p className="text-lg font-black">{Math.round(sessionVolume).toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Kg</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <Progress value={sessionProgress} className="h-2" />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-md">{sessionSignal}</Badge>
                <span>{remainingSetCount} set{remainingSetCount === 1 ? '' : 's'} left</span>
                <span>{estimatedRemainingMinutes} min est.</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3 shadow-[0_18px_50px_rgba(0,229,255,0.10)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wide text-primary">Current lift</p>
                  <p className="mt-1 truncate text-base font-black">
                    {activeSessionExercise?.exerciseName || 'Ready to train'}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activeSessionExercise
                      ? `${activeSessionExercise.sets.filter((set) => set.done).length}/${activeSessionExercise.sets.length} sets done${activeSessionSetIndex >= 0 ? ` - set ${activeSessionSetIndex + 1} next` : ''}`
                      : 'Add an exercise to begin.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <Button
                    onClick={completeNextSessionSet}
                    disabled={activeSessionExerciseIndex < 0 || activeSessionSetIndex < 0}
                    className="h-11 rounded-lg font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Next Set
                  </Button>
                  <Button
                    onClick={finishSession}
                    disabled={sessionSaving || sessionExercises.length === 0}
                    variant="outline"
                    className="h-11 rounded-lg border-primary/30 bg-background/45 font-bold hover:bg-primary/10"
                  >
                    {sessionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                    Finish
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-primary">Start flow</p>
                    <h3 className="mt-1 text-lg font-black">Prepare before the first working set</h3>
                  </div>
                  <Badge variant="outline" className="rounded-md bg-background/50">
                    {sessionPrepChecks.filter(Boolean).length}/{sessionPrepItems.length}
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {sessionPrepItems.map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSessionPrep(index)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        sessionPrepChecks[index]
                          ? 'border-primary/40 bg-primary/15 text-foreground'
                          : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <CheckCircle2 className={cn('h-4 w-4 shrink-0', sessionPrepChecks[index] ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="min-w-0 truncate">{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Today&apos;s sequence</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {['Prep', 'Lift', 'Rest', 'Finish'].map((step, index) => {
                    const active =
                      (index === 0 && sessionDoneSetCount === 0 && sessionPrepChecks.some((checked) => !checked)) ||
                      (index === 1 && sessionProgress > 0 && sessionProgress < 100 && !restRunning) ||
                      (index === 2 && restRunning) ||
                      (index === 3 && sessionProgress >= 100);

                    return (
                      <div
                        key={step}
                        className={cn(
                          'rounded-lg border px-2 py-3 text-center',
                          active ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-background/40'
                        )}
                      >
                        <p className={cn('text-lg font-black', active && 'text-primary')}>{index + 1}</p>
                        <p className="mt-1 truncate text-[10px] font-black uppercase text-muted-foreground">{step}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_18rem_18rem]">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Rest timer</p>
                    <p className="mt-1 text-3xl font-black tabular-nums">{formatTimer(restSeconds)}</p>
                  </div>
                  <Button
                    variant={restRunning ? 'secondary' : 'default'}
                    className="rounded-lg font-bold"
                    onClick={() => setRestRunning((value) => !value)}
                  >
                    {restRunning ? <CirclePause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    {restRunning ? 'Pause' : 'Start'}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 90, 120].map((seconds) => (
                    <Button
                      key={seconds}
                      variant={restSeconds === seconds ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        setRestSeconds(seconds);
                        setRestRunning(false);
                      }}
                    >
                      {formatTimer(seconds)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="hidden rounded-lg border border-primary/25 bg-primary/10 p-4 sm:block">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-primary">Live lift</p>
                    <p className="mt-1 line-clamp-1 text-lg font-black">
                      {activeSessionExercise?.exerciseName || 'Ready'}
                    </p>
                  </div>
                  <Target className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {activeSessionExercise
                      ? `${activeSessionExercise.sets.filter((set) => set.done).length}/${activeSessionExercise.sets.length} sets complete${activeSessionSetIndex >= 0 ? ` - set ${activeSessionSetIndex + 1} next` : ''}`
                      : 'Add an exercise to begin.'}
                  </p>
                  <p className="line-clamp-1">
                    Next: {nextSessionExercise?.exerciseName || (sessionProgress >= 100 ? 'Finish and save' : 'Final push')}
                  </p>
                  <p>{Math.round(completedSessionVolume).toLocaleString()}kg completed volume</p>
                </div>
                <Button
                  onClick={completeNextSessionSet}
                  disabled={activeSessionExerciseIndex < 0 || activeSessionSetIndex < 0}
                  className="mt-4 h-10 w-full rounded-lg font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Next Set
                </Button>
              </div>

              <div className="hidden rounded-lg border bg-muted/20 p-4 sm:block">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Finish flow</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Finish saves the session to history{sessionShouldCompleteToday ? ' and marks today complete.' : '.'}
                </p>
                <Button
                  onClick={finishSession}
                  disabled={sessionSaving || sessionExercises.length === 0}
                  className="mt-4 h-11 w-full rounded-lg font-bold"
                >
                  {sessionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Finish Workout
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {sessionExercises.map((exercise, exerciseIndex) => {
                const exerciseDoneSets = exercise.sets.filter((set) => set.done).length;
                const exerciseProgress = exercise.sets.length > 0
                  ? Math.round((exerciseDoneSets / exercise.sets.length) * 100)
                  : 0;
                const exerciseSwaps = getSessionSwaps(exercise.sourceExercise);

                return (
                <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="rounded-lg border bg-card p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSessionExercise(exerciseIndex)}
                      className="flex min-w-0 items-start gap-3 text-left"
                    >
                      <span className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                        exercise.done ? 'border-primary bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'
                      )}>
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-black uppercase">{exercise.exerciseName}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {exerciseDoneSets}/{exercise.sets.length} sets complete
                          {exercise.sourceExercise ? ` - ${exercise.sourceExercise.muscleGroup}` : ''}
                        </span>
                      </span>
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => addSessionSet(exerciseIndex)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Set
                    </Button>
                  </div>

                  <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <Progress value={exerciseProgress} className="h-1.5" />
                    {exerciseSwaps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exerciseSwaps.map((swap) => (
                          <Button
                            key={swap.id}
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => swapSessionExercise(exerciseIndex, swap)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {swap.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={`${exercise.exerciseId}-set-${setIndex}`}
                        className={cn(
                          'grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-lg border p-2 sm:grid-cols-[2.5rem_1fr_1fr_2.5rem_2.5rem]',
                          set.done ? 'border-primary/40 bg-primary/10' : 'bg-muted/20'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSessionSet(exerciseIndex, setIndex)}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-black',
                            set.done ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                          )}
                          aria-label={`Toggle set ${setIndex + 1}`}
                        >
                          {setIndex + 1}
                        </button>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={set.weight || ''}
                            onChange={(event) => updateSessionSet(exerciseIndex, setIndex, 'weight', Number(event.target.value))}
                            className="h-9 rounded-lg pr-8"
                            placeholder="0"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">kg</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={set.reps || ''}
                            onChange={(event) => updateSessionSet(exerciseIndex, setIndex, 'reps', Number(event.target.value))}
                            className="h-9 rounded-lg pr-10"
                            placeholder="0"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">reps</span>
                        </div>
                        <Button
                          variant={set.done ? 'secondary' : 'outline'}
                          size="icon"
                          className="hidden h-9 w-9 rounded-lg sm:inline-flex"
                          onClick={() => toggleSessionSet(exerciseIndex, setIndex)}
                          aria-label="Mark set done"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden h-9 w-9 rounded-lg text-muted-foreground hover:text-red-400 sm:inline-flex"
                          disabled={exercise.sets.length === 1}
                          onClick={() => removeSessionSet(exerciseIndex, setIndex)}
                          aria-label="Remove set"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Session notes</Label>
              <Textarea
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                placeholder="Energy, pain, personal records, next target..."
                className="min-h-24 resize-none rounded-lg"
              />
            </div>
          </div>
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

              <div className="grid gap-3 sm:grid-cols-2">
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
    </FutureShell>
  );
}
