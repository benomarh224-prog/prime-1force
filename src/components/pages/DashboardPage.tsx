'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { progressData, dailyCalorieData, weeklySchedule, exercises } from '@/lib/data';
import {
  User, Target, Flame, TrendingDown, Calendar,
  Dumbbell, Trophy, Edit3, Save, X, Check,
  Weight, Ruler, Activity, Apple, Camera,
  Plus, Trash2, Clock, ClipboardList, ListChecks, Award, Shield, BarChart3,
  CheckCircle2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell,
} from 'recharts';
import { useSession } from 'next-auth/react';

// ─── Avatar Options ────────────────────────────────────────────────────
const avatarOptions = [
  { id: 'emerald', emoji: '💪', gradient: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-500/40' },
  { id: 'violet', emoji: '🏋️', gradient: 'from-violet-500 to-purple-600', ring: 'ring-violet-500/40' },
  { id: 'amber', emoji: '🔥', gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-500/40' },
  { id: 'rose', emoji: '🎯', gradient: 'from-rose-500 to-pink-600', ring: 'ring-rose-500/40' },
  { id: 'sky', emoji: '⚡', gradient: 'from-sky-500 to-blue-600', ring: 'ring-sky-500/40' },
  { id: 'lime', emoji: '🥇', gradient: 'from-lime-500 to-green-600', ring: 'ring-lime-500/40' },
  { id: 'fuchsia', emoji: '⭐', gradient: 'from-fuchsia-500 to-pink-600', ring: 'ring-fuchsia-500/40' },
  { id: 'teal', emoji: '🧬', gradient: 'from-teal-500 to-cyan-600', ring: 'ring-teal-500/40' },
];

const goalLabels: Record<string, string> = {
  lose_weight: 'Lose Weight',
  gain_muscle: 'Build Muscle',
  stay_fit: 'Stay Fit',
  increase_endurance: 'Endurance',
};

const levelLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

import type { WorkoutExercise, WorkoutLog } from '@/lib/store';

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarOption(id: string) {
  return avatarOptions.find((a) => a.id === id) || avatarOptions[0];
}

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getWorkoutDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

type DashboardResponse = {
  success: boolean;
  error?: string;
  profile?: {
    name?: string;
    avatar?: string;
    weight?: number;
    height?: number;
    goal?: string;
    level?: string;
    weeklyGoal?: number;
  };
  workoutLogs?: WorkoutLog[];
  workout?: WorkoutLog;
};

export function DashboardPage() {
  const store = useAppStore();
  const { toast } = useToast();
  const { status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardSaving, setDashboardSaving] = useState(false);
  const [syncingWorkoutId, setSyncingWorkoutId] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  // Detect hydration from localStorage (Zustand persist)
  const emptySubscribe = () => () => {};
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const avatarPickerRef = useRef<HTMLDivElement>(null);

  // editData is always seeded from the store when entering edit mode
  const [editData, setEditData] = useState({
    name: store.userName || '',
    weight: store.userWeight,
    height: store.userHeight,
    goal: store.userGoal,
    level: store.userLevel,
    weeklyGoal: store.weeklyGoal,
    avatar: store.userAvatar || 'emerald',
  });

  // Whenever user clicks Edit, seed editData from latest store values
  const startEditing = () => {
    setEditData({
      name: store.userName || '',
      weight: store.userWeight,
      height: store.userHeight,
      goal: store.userGoal,
      level: store.userLevel,
      weeklyGoal: store.weeklyGoal,
      avatar: store.userAvatar || 'emerald',
    });
    setIsEditing(true);
  };

  // Close avatar picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarPickerRef.current && !avatarPickerRef.current.contains(e.target as Node)) {
        setShowAvatarPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const applyDashboardData = useCallback((data: DashboardResponse) => {
    const actions = useAppStore.getState();

    if (data.profile) {
      actions.setUserProfile({
        name: data.profile.name,
        avatar: data.profile.avatar,
        weight: data.profile.weight,
        height: data.profile.height,
        goal: data.profile.goal,
        level: data.profile.level,
        weeklyGoal: data.profile.weeklyGoal,
      });
      setEditData({
        name: data.profile.name || '',
        weight: data.profile.weight ?? 75,
        height: data.profile.height ?? 175,
        goal: data.profile.goal || 'lose_weight',
        level: data.profile.level || 'intermediate',
        weeklyGoal: data.profile.weeklyGoal ?? 5,
        avatar: data.profile.avatar || 'emerald',
      });
    }

    if (data.workoutLogs) {
      actions.setWorkoutLogs(data.workoutLogs);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    const data = (await response.json()) as DashboardResponse;
    if (!response.ok || !data.success) throw new Error(data.error || 'Could not load dashboard');
    return data;
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;
    setDashboardLoading(true);

    fetchDashboardData()
      .then((data) => {
        if (mounted) applyDashboardData(data);
      })
      .catch((error) => {
        if (!mounted) return;
        toast({
          title: 'Could not load account data',
          description: error instanceof Error ? error.message : 'Your local dashboard is still available.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (mounted) setDashboardLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [applyDashboardData, fetchDashboardData, status, toast]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;

    let mounted = true;
    fetch('/api/workout-sessions')
      .then(async (response) => {
        const data = (await response.json()) as DashboardResponse;
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not load workouts');
        if (mounted && data.workoutLogs) {
          useAppStore.getState().setWorkoutLogs(data.workoutLogs);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        toast({
          title: 'Could not load workout history',
          description: error instanceof Error ? error.message : 'Your local dashboard is still available.',
          variant: 'destructive',
        });
      });

    return () => {
      mounted = false;
    };
  }, [status, toast]);

  const totalCaloriesBurned = dailyCalorieData.reduce((sum, d) => sum + d.burned, 0);
  const completedLogs = store.workoutLogs.filter((log) => log.completed);
  const completedDateKeys = new Set(completedLogs.map((log) => log.date));
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const completedWorkoutsThisWeek = completedLogs.filter(
    (log) => getWorkoutDate(log.date) >= startOfWeek
  ).length;
  const scheduledWorkoutsDone = weeklySchedule.filter((d) => d.done).length;
  const totalWorkouts = Math.max(completedWorkoutsThisWeek, scheduledWorkoutsDone);
  const bmi = store.userHeight > 0 ? (store.userWeight / (store.userHeight / 100) ** 2).toFixed(1) : '—';
  let currentStreak = 0;
  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (!completedDateKeys.has(toDateKey(date))) break;
    currentStreak += 1;
  }
  const weeklyProgress = store.weeklyGoal > 0 ? (totalWorkouts / store.weeklyGoal) * 100 : 0;
  const totalLoggedSets = store.workoutLogs.reduce(
    (sum, log) => sum + log.exercises.reduce((exerciseSum, ex) => exerciseSum + ex.sets.length, 0),
    0
  );
  const totalVolume = store.workoutLogs.reduce(
    (sum, log) =>
      sum +
      log.exercises.reduce(
        (exerciseSum, ex) => exerciseSum + ex.sets.reduce((setSum, set) => setSum + set.weight * set.reps, 0),
        0
      ),
    0
  );
  const macroData = [
    { name: 'Protein', value: dailyCalorieData.reduce((s, d) => s + d.protein, 0) / 7, fill: 'oklch(0.62 0.24 27)' },
    { name: 'Carbs', value: dailyCalorieData.reduce((s, d) => s + d.carbs, 0) / 7, fill: 'oklch(0.75 0.12 60)' },
    { name: 'Fat', value: dailyCalorieData.reduce((s, d) => s + d.fat, 0) / 7, fill: 'oklch(0.60 0.15 250)' },
  ];
  const weightProgressData = useMemo(() => {
    const latestDemoWeight = progressData[progressData.length - 1]?.weight ?? store.userWeight;
    const profileOffset = store.userWeight - latestDemoWeight;

    return progressData.map((entry) => ({
      ...entry,
      weight: Number((entry.weight + profileOffset).toFixed(1)),
    }));
  }, [store.userWeight]);
  const personalRecords = Array.from(
    store.workoutLogs
      .flatMap((log) =>
        log.exercises.map((entry) => ({
          ...entry,
          date: log.date,
          completed: log.completed,
          volume: entry.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
          bestSet: entry.sets.reduce(
            (best, set) => (set.weight > best.weight ? set : best),
            { reps: 0, weight: 0 }
          ),
        }))
      )
      .reduce((records, entry) => {
        const current = records.get(entry.exerciseId);
        if (!current || entry.bestSet.weight > current.bestSet.weight || entry.volume > current.volume) {
          records.set(entry.exerciseId, entry);
        }
        return records;
      }, new Map<string, {
        exerciseId: string;
        exerciseName: string;
        sets: WorkoutExercise['sets'];
        date: string;
        completed?: boolean;
        volume: number;
        bestSet: { reps: number; weight: number };
      }>())
      .values()
  )
    .filter((record) => record.bestSet.weight > 0 || record.volume > 0)
    .sort((a, b) => b.bestSet.weight - a.bestSet.weight || b.volume - a.volume)
    .slice(0, 4);
  const achievements = [
    {
      title: 'First Session',
      description: 'Complete your first workout',
      icon: <Check className="h-4 w-4" />,
      unlocked: completedLogs.length >= 1,
      progress: Math.min(completedLogs.length, 1),
      target: 1,
    },
    {
      title: 'Weekly Warrior',
      description: 'Complete 5 workouts this week',
      icon: <Calendar className="h-4 w-4" />,
      unlocked: completedWorkoutsThisWeek >= 5,
      progress: Math.min(completedWorkoutsThisWeek, 5),
      target: 5,
    },
    {
      title: 'Set Collector',
      description: 'Log 100 total sets',
      icon: <ListChecks className="h-4 w-4" />,
      unlocked: totalLoggedSets >= 100,
      progress: Math.min(totalLoggedSets, 100),
      target: 100,
    },
    {
      title: 'Gold Streak',
      description: 'Build a 7-day streak',
      icon: <Flame className="h-4 w-4" />,
      unlocked: currentStreak >= 7,
      progress: Math.min(currentStreak, 7),
      target: 7,
    },
    {
      title: 'PR Hunter',
      description: 'Unlock 3 personal records',
      icon: <Trophy className="h-4 w-4" />,
      unlocked: personalRecords.length >= 3,
      progress: Math.min(personalRecords.length, 3),
      target: 3,
    },
    {
      title: 'Volume Club',
      description: 'Move 10,000kg total volume',
      icon: <BarChart3 className="h-4 w-4" />,
      unlocked: totalVolume >= 10000,
      progress: Math.min(Math.round(totalVolume), 10000),
      target: 10000,
    },
  ];

  const forgeScoreFactors = [
    {
      label: 'Consistency',
      value: Math.min(Math.round(weeklyProgress), 100),
      detail: `${totalWorkouts}/${store.weeklyGoal} workouts`,
    },
    {
      label: 'Streak',
      value: Math.min(Math.round((currentStreak / 7) * 100), 100),
      detail: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`,
    },
    {
      label: 'Strength',
      value: Math.min(Math.round((totalVolume / 10000) * 100), 100),
      detail: `${Math.round(totalVolume).toLocaleString()}kg moved`,
    },
    {
      label: 'Records',
      value: Math.min(Math.round((personalRecords.length / 4) * 100), 100),
      detail: `${personalRecords.length} PR${personalRecords.length === 1 ? '' : 's'}`,
    },
  ];
  const forgeScore = Math.round(
    forgeScoreFactors[0].value * 0.35 +
    forgeScoreFactors[1].value * 0.25 +
    forgeScoreFactors[2].value * 0.25 +
    forgeScoreFactors[3].value * 0.15
  );
  const forgeRank =
    forgeScore >= 85 ? 'Elite momentum' :
      forgeScore >= 65 ? 'Strong rhythm' :
        forgeScore >= 40 ? 'Building base' :
          'Fresh start';
  const nextForgeMove =
    totalWorkouts < store.weeklyGoal
      ? `Complete ${store.weeklyGoal - totalWorkouts} more workout${store.weeklyGoal - totalWorkouts === 1 ? '' : 's'} this week.`
      : currentStreak < 7
        ? 'Keep the streak alive for a 7-day badge.'
        : totalVolume < 10000
          ? `Move ${(10000 - Math.round(totalVolume)).toLocaleString()}kg more to enter Volume Club.`
          : 'Chase a new personal record this week.';
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const recentLoggedExercises = store.workoutLogs
    .filter((log) => getWorkoutDate(log.date) >= sevenDaysAgo)
    .flatMap((log) => log.exercises);
  const trainedMuscles = Array.from(new Set(
    recentLoggedExercises
      .map((entry) => exercises.find((exercise) => exercise.id === entry.exerciseId || exercise.name === entry.exerciseName)?.muscleGroup)
      .filter(Boolean) as string[]
  )).sort();
  const focusGaps = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps']
    .filter((muscle) => !trainedMuscles.includes(muscle))
    .slice(0, 3);
  const weeklyReview = completedLogs.length === 0
    ? 'Start with one logged workout. The score unlocks once your first completed session is saved.'
    : totalWorkouts >= store.weeklyGoal
      ? 'You hit the weekly training target. Keep intensity controlled and look for one quality PR attempt.'
      : totalWorkouts > 0
        ? 'You have momentum. Add one focused session and keep the week from becoming random.'
        : 'This week is still empty. Pick a short session and make the first mark on the board.';

  const displayName = store.userName || 'Set Your Name';
  const avatar = getAvatarOption(store.userAvatar || 'emerald');

  const handleSave = async () => {
    if (status !== 'authenticated') {
      openAuthDialog('login');
      return;
    }

    const weight = Number(editData.weight);
    const height = Number(editData.height);
    const weeklyGoal = Number(editData.weeklyGoal);

    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      toast({
        title: 'Check your weight',
        description: 'Weight must be between 30 and 300 kg.',
        variant: 'destructive',
      });
      return;
    }

    if (!Number.isFinite(height) || height < 100 || height > 250) {
      toast({
        title: 'Check your height',
        description: 'Height must be between 100 and 250 cm.',
        variant: 'destructive',
      });
      return;
    }

    if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 14) {
      toast({
        title: 'Check your weekly goal',
        description: 'Weekly workout goal must be between 1 and 14.',
        variant: 'destructive',
      });
      return;
    }

    const profile = {
      name: editData.name.trim() || undefined,
      weight,
      height,
      goal: editData.goal,
      level: editData.level,
      weeklyGoal,
      avatar: editData.avatar,
    };

    setDashboardSaving(true);
    try {
      const response = await fetch('/api/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = (await response.json()) as DashboardResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not save profile');

      const freshData = await fetchDashboardData();
      applyDashboardData(freshData);
      setIsEditing(false);
      setShowAvatarPicker(false);
      setProfileSuccess(true);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      toast({
        title: 'Profile saved',
        description: 'Your account has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Could not save profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDashboardSaving(false);
    }
  };

  // ─── Workout Tracker State ─────────────────────────────────
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    notes: '',
    exercises: [] as WorkoutExercise[],
  });

  const openWorkoutDialog = () => {
    setWorkoutForm({ name: '', date: new Date().toISOString().split('T')[0], duration: 0, notes: '', exercises: [] });
    setShowWorkoutDialog(true);
  };

  const addExerciseToForm = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    setWorkoutForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseId: ex.id, exerciseName: ex.name, sets: [{ reps: 10, weight: 20 }] }],
    }));
  };

  const removeExerciseFromForm = (idx: number) => {
    setWorkoutForm((prev) => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    setWorkoutForm((prev) => {
      const updated = [...prev.exercises];
      const sets = [...updated[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      updated[exIdx] = { ...updated[exIdx], sets };
      return { ...prev, exercises: updated };
    });
  };

  const addSet = (exIdx: number) => {
    setWorkoutForm((prev) => {
      const updated = [...prev.exercises];
      const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
      updated[exIdx] = { ...updated[exIdx], sets: [...updated[exIdx].sets, { reps: lastSet?.reps ?? 10, weight: lastSet?.weight ?? 20 }] };
      return { ...prev, exercises: updated };
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setWorkoutForm((prev) => {
      const updated = [...prev.exercises];
      updated[exIdx] = { ...updated[exIdx], sets: updated[exIdx].sets.filter((_, i) => i !== setIdx) };
      return { ...prev, exercises: updated };
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutForm.name.trim() || workoutForm.exercises.length === 0) {
      toast({ title: 'Missing info', description: 'Add a workout name and at least one exercise.', variant: 'destructive' });
      return;
    }

    const workout = {
      name: workoutForm.name.trim(),
      date: workoutForm.date,
      duration: workoutForm.duration,
      notes: workoutForm.notes.trim(),
      completed: false,
      exercises: workoutForm.exercises,
    };

    setDashboardSaving(true);
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout }),
      });
      const data = (await response.json()) as DashboardResponse;
      if (!response.ok || !data.success || !data.workout) throw new Error(data.error || 'Could not save workout');

      store.upsertWorkoutLog(data.workout);
      setShowWorkoutDialog(false);
      toast({ title: 'Workout logged', description: `${workoutForm.name} saved to your workout history.` });
    } catch (error) {
      toast({
        title: 'Could not save workout',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDashboardSaving(false);
    }
  };

  const handleToggleWorkout = async (log: WorkoutLog, completed: boolean) => {
    const nextLog = { ...log, completed };
    setSyncingWorkoutId(log.id);
    store.upsertWorkoutLog(nextLog);

    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId: log.id, workout: nextLog }),
      });
      const data = (await response.json()) as DashboardResponse;
      if (!response.ok || !data.success || !data.workout) throw new Error(data.error || 'Could not update workout');
      store.upsertWorkoutLog(data.workout);
    } catch (error) {
      store.upsertWorkoutLog(log);
      toast({
        title: 'Could not update workout',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSyncingWorkoutId(null);
    }
  };

  const handleDeleteWorkout = async (log: WorkoutLog) => {
    setSyncingWorkoutId(log.id);
    store.deleteWorkoutLog(log.id);

    try {
      const response = await fetch(`/api/workout-sessions?workoutId=${encodeURIComponent(log.id)}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as DashboardResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not delete workout');
    } catch (error) {
      store.upsertWorkoutLog(log);
      toast({
        title: 'Could not delete workout',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSyncingWorkoutId(null);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: store.userName || '',
      weight: store.userWeight,
      height: store.userHeight,
      goal: store.userGoal,
      level: store.userLevel,
      weeklyGoal: store.weeklyGoal,
      avatar: store.userAvatar || 'emerald',
    });
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  useEffect(() => {
    if (!profileSuccess) return;
    const timeout = window.setTimeout(() => setProfileSuccess(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [profileSuccess]);

  if (!isHydrated || status === 'loading' || (status === 'authenticated' && dashboardLoading)) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pb-16 pt-24">
        <Card className="w-full max-w-md border-primary/15">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Login Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to view your dashboard, profile, and workout history.
            </p>
            <Button onClick={() => openAuthDialog('login')} className="mt-5 w-full rounded-lg">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Your <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">Track your fitness journey</p>
          </div>
          <motion.div className="w-full sm:w-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button onClick={startEditing} className="w-full rounded-xl gap-2 sm:w-auto">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          </motion.div>
        </motion.div>

        {profileSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Profile saved successfully.</span>
          </motion.div>
        )}

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Flame className="h-5 w-5" />, label: 'Calories Burned', value: totalCaloriesBurned.toLocaleString(), sub: 'This week', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { icon: <Dumbbell className="h-5 w-5" />, label: 'Workouts', value: `${totalWorkouts}/${store.weeklyGoal}`, sub: 'Weekly goal', color: 'text-primary', bg: 'bg-primary/10' },
            { icon: <Trophy className="h-5 w-5" />, label: 'Streak', value: `${currentStreak}d`, sub: 'Keep going!', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: <TrendingDown className="h-5 w-5" />, label: 'Weight', value: `${store.userWeight}kg`, sub: `BMI: ${bmi}`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', stat.bg, stat.color)}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/70">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Forge Score */}
        <motion.div
          className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <Card className="overflow-hidden border-primary/25 bg-primary/10">
            <CardContent className="grid gap-6 p-5 sm:p-6 md:grid-cols-[210px_1fr] md:items-center">
              <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-primary/25 bg-background/70 shadow-2xl shadow-primary/10">
                <div
                  className="absolute inset-3 rounded-full"
                  style={{
                    background: `conic-gradient(oklch(0.62 0.24 27) ${forgeScore * 3.6}deg, oklch(1 0 0 / 10%) 0deg)`,
                  }}
                />
                <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-background">
                  <p className="text-5xl font-black tabular-nums">{forgeScore}</p>
                  <p className="text-[10px] font-black uppercase tracking-wide text-primary">Forge Score</p>
                </div>
              </div>

              <div className="min-w-0">
                <Badge className="mb-3 rounded-md border-primary/25 bg-background/80 text-primary">
                  {forgeRank}
                </Badge>
                <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  Your training signal
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A single score blending consistency, streak, strength volume, and personal records.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {forgeScoreFactors.map((factor) => (
                    <div key={factor.label} className="rounded-lg border border-border/50 bg-background/60 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                        <span className="font-bold">{factor.label}</span>
                        <span className="font-black text-primary">{factor.value}%</span>
                      </div>
                      <Progress value={factor.value} className="h-1.5" />
                      <p className="mt-2 text-xs text-muted-foreground">{factor.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Coach review</p>
                <h3 className="mt-2 text-xl font-black">This week&apos;s read</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{weeklyReview}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-primary">Next best move</p>
                <p className="mt-2 text-sm font-semibold">{nextForgeMove}</p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Muscle coverage</p>
                  <Badge variant="outline" className="rounded-md">{trainedMuscles.length} hit</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(trainedMuscles.length ? trainedMuscles : ['No muscles logged yet']).map((muscle) => (
                    <span key={muscle} className="rounded-md border border-border/60 bg-muted/35 px-2.5 py-1 text-xs font-semibold">
                      {muscle}
                    </span>
                  ))}
                </div>
                {focusGaps.length > 0 && (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Balance cue: add {focusGaps.join(', ')} before the week ends.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.title}
                      className={cn(
                        'rounded-xl border p-3 transition-colors',
                        achievement.unlocked
                          ? 'border-primary/35 bg-primary/10'
                          : 'border-border/50 bg-muted/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center',
                            achievement.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {achievement.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate">{achievement.title}</p>
                            {achievement.unlocked && (
                              <Badge className="h-5 border-primary/20 bg-primary/10 text-primary text-[10px]">Unlocked</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                          <div className="mt-2">
                            <Progress value={(achievement.progress / achievement.target) * 100} className="h-1.5" />
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {achievement.progress.toLocaleString()} / {achievement.target.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Personal Records */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personalRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No records yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Log sets with weight to unlock your strongest lifts.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {personalRecords.map((record) => (
                    <div key={record.exerciseId} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{record.exerciseName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        {record.completed && (
                          <Badge className="h-5 border-primary/20 bg-primary/10 text-primary text-[10px]">Complete</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-background/50 p-2">
                          <p className="text-muted-foreground">Best Set</p>
                          <p className="font-semibold">{record.bestSet.weight}kg x {record.bestSet.reps}</p>
                        </div>
                        <div className="rounded-lg bg-background/50 p-2">
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-semibold">{record.volume}kg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weight Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    Weight Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightProgressData}>
                        <defs>
                          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.62 0.24 27)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.62 0.24 27)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="oklch(0.5 0 0 / 30%)" />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} stroke="oklch(0.5 0 0 / 30%)" />
                        <Tooltip
                          contentStyle={{
                            background: 'oklch(0.17 0.005 110)',
                            border: '1px solid oklch(1 0 0 / 10%)',
                            borderRadius: '12px',
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="weight" stroke="oklch(0.62 0.24 27)" fill="url(#weightGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Calories Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Daily Calories
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyCalorieData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="oklch(0.5 0 0 / 30%)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.5 0 0 / 30%)" />
                        <Tooltip
                          contentStyle={{
                            background: 'oklch(0.17 0.005 110)',
                            border: '1px solid oklch(1 0 0 / 10%)',
                            borderRadius: '12px',
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="consumed" fill="oklch(0.62 0.24 27)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="burned" fill="oklch(0.75 0.12 60)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-border/50 overflow-visible">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center text-xl ring-2 ring-offset-2 ring-offset-background shrink-0',
                            `bg-gradient-to-br ${avatar.gradient}`,
                            avatar.ring,
                          )}>
                            {store.userName ? getInitials(store.userName) : avatar.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-lg truncate">{displayName}</p>
                            <Badge variant="secondary" className="mt-1">{levelLabels[store.userLevel] || store.userLevel}</Badge>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <Weight className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <p className="text-sm font-semibold">{store.userWeight}kg</p>
                            <p className="text-xs text-muted-foreground">Weight</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <Ruler className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <p className="text-sm font-semibold">{store.userHeight}cm</p>
                            <p className="text-xs text-muted-foreground">Height</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <p className="text-sm font-semibold">{goalLabels[store.userGoal] || store.userGoal}</p>
                            <p className="text-xs text-muted-foreground">Goal</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <p className="text-sm font-semibold">{store.weeklyGoal}/wk</p>
                            <p className="text-xs text-muted-foreground">Target</p>
                          </div>
                        </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Weekly Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Workout Goal</span>
                      <span className="font-semibold text-primary">{totalWorkouts}/{store.weeklyGoal}</span>
                    </div>
                    <Progress value={Math.min(weeklyProgress, 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    {weeklySchedule.map((day) => (
                      <div key={day.day} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-medium',
                            day.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {day.done ? '✓' : day.day}
                          </div>
                          <span className={cn(day.done && 'line-through text-muted-foreground')}>{day.workout}</span>
                        </div>
                        {day.duration > 0 && (
                          <span className="text-xs text-muted-foreground">{day.duration}m</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Macro Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Apple className="h-4 w-4 text-primary" />
                    Avg. Daily Macros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {macroData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'oklch(0.17 0.005 110)',
                            border: '1px solid oklch(1 0 0 / 10%)',
                            borderRadius: '12px',
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {macroData.map((m) => (
                      <div key={m.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.fill }} />
                        <span className="text-muted-foreground">{m.name}: <span className="font-medium text-foreground">{Math.round(m.value)}g</span></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ═══════════ WORKOUT TRACKER ═══════════ */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Workout Tracker
                </CardTitle>
                <Button onClick={openWorkoutDialog} size="sm" className="h-8 w-full rounded-lg gap-1.5 text-xs sm:w-auto">
                  <Plus className="h-3.5 w-3.5" /> Log Workout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {store.workoutLogs.length === 0 ? (
                <div className="text-center py-10">
                  <Dumbbell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No workouts logged yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Start tracking your sessions to see history here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {store.workoutLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors',
                        log.completed ? 'border-primary/40' : 'border-border/50'
                      )}
                    >
                      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-sm font-semibold">{log.name}</p>
                            {log.completed && (
                              <Badge className="h-5 border-primary/20 bg-primary/10 text-primary text-[10px]">
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {log.duration > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{log.duration}m</span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />{log.exercises.length} exercises</span>
                          <button
                            onClick={() => handleToggleWorkout(log, !log.completed)}
                            disabled={syncingWorkoutId === log.id}
                            className={cn(
                              'h-6 px-2 rounded-md flex items-center gap-1 text-xs transition-colors',
                              log.completed
                                ? 'text-primary bg-primary/10 hover:bg-primary/15'
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                            )}
                            aria-label={log.completed ? 'Mark workout incomplete' : 'Complete workout'}
                          >
                            <Check className="h-3 w-3" />
                            {log.completed ? 'Done' : 'Complete'}
                          </button>
                          <button
                            onClick={() => handleDeleteWorkout(log)}
                            disabled={syncingWorkoutId === log.id}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            aria-label="Delete workout"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {log.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate mr-2">{ex.exerciseName}</span>
                            <span className="shrink-0 text-muted-foreground/80">
                              {ex.sets.length} × {ex.sets[0]?.reps ?? 0} reps @ {ex.sets[0]?.weight ?? 0}kg
                            </span>
                          </div>
                        ))}
                      </div>
                      {log.notes && (
                        <p className="text-[11px] text-muted-foreground/60 mt-2 italic border-t border-border/30 pt-2">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditing}
        onOpenChange={(open) => {
          if (open) {
            setIsEditing(true);
          } else {
            handleCancel();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            <div className="space-y-2" ref={avatarPickerRef}>
              <Label className="text-xs">Profile Icon</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border/50 p-2 transition-colors hover:border-primary/30"
                >
                  <div
                    className={cn(
                      'h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center text-lg ring-2 ring-offset-2 ring-offset-background transition-all shrink-0',
                      `bg-gradient-to-br ${getAvatarOption(editData.avatar).gradient}`,
                      getAvatarOption(editData.avatar).ring,
                    )}
                  >
                    {editData.name ? getInitials(editData.name) : getAvatarOption(editData.avatar).emoji}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{editData.name || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground">Click to change icon</p>
                  </div>
                  <Camera className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </button>

                <AnimatePresence>
                  {showAvatarPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border/50 bg-card p-3 shadow-xl"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {avatarOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setEditData({ ...editData, avatar: option.id });
                              setShowAvatarPicker(false);
                            }}
                            className={cn(
                              'h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg ring-2 ring-offset-2 ring-offset-card transition-all hover:scale-105',
                              option.gradient,
                              editData.avatar === option.id ? option.ring : 'ring-transparent',
                            )}
                            aria-label={`Choose ${option.id} profile icon`}
                          >
                            {option.emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Your name"
                className="h-10 rounded-lg"
              />
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  min={30}
                  max={300}
                  value={editData.weight}
                  onChange={(e) => setEditData({ ...editData, weight: Number(e.target.value) })}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Height (cm)</Label>
                <Input
                  type="number"
                  min={100}
                  max={250}
                  value={editData.height}
                  onChange={(e) => setEditData({ ...editData, height: Number(e.target.value) })}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Main Goal</Label>
                <Select value={editData.goal} onValueChange={(value) => setEditData({ ...editData, goal: value })}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="gain_muscle">Build Muscle</SelectItem>
                    <SelectItem value="stay_fit">Stay Fit</SelectItem>
                    <SelectItem value="increase_endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fitness Level</Label>
                <Select value={editData.level} onValueChange={(value) => setEditData({ ...editData, level: value })}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Weekly Workout Goal</Label>
              <Input
                type="number"
                min={1}
                max={14}
                value={editData.weeklyGoal}
                onChange={(e) => setEditData({ ...editData, weeklyGoal: Number(e.target.value) })}
                className="h-10 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl gap-2" disabled={dashboardSaving}>
              {dashboardSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dashboardSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Log Workout
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Workout Name & Date */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Workout Name *</Label>
                <Input
                  placeholder="e.g., Push Day"
                  value={workoutForm.name}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={workoutForm.date}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={300}
                value={workoutForm.duration || ''}
                placeholder="60"
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration: Number(e.target.value) })}
                className="h-9 w-full rounded-lg sm:w-32"
              />
            </div>

            <Separator />

            {/* Add Exercise */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Exercises *</Label>
              {workoutForm.exercises.length > 0 && (
                <div className="space-y-3">
                  {workoutForm.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate mr-2">{ex.exerciseName}</p>
                        <button
                          onClick={() => removeExerciseFromForm(exIdx)}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                          aria-label="Remove exercise"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-6 text-center font-medium">S{setIdx + 1}</span>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  value={set.weight || ''}
                                  onChange={(e) => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                                  className="h-8 rounded-lg text-xs pr-8"
                                  placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">kg</span>
                              </div>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  value={set.reps || ''}
                                  onChange={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                                  className="h-8 rounded-lg text-xs pr-10"
                                  placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">reps</span>
                              </div>
                            </div>
                            {ex.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(exIdx, setIdx)}
                                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                aria-label="Remove set"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addSet(exIdx)} className="h-7 text-xs gap-1 rounded-lg w-full">
                          <Plus className="h-3 w-3" /> Add Set
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exercise picker */}
              <Select onValueChange={(v) => addExerciseToForm(v)}>
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue placeholder="+ Add an exercise..." />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{ex.muscleGroup}</Badge>
                        {ex.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="How did it feel? Any PRs?"
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                className="min-h-[60px] rounded-lg text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowWorkoutDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveWorkout} className="rounded-xl gap-2" disabled={dashboardSaving || !workoutForm.name.trim() || workoutForm.exercises.length === 0}>
              <Save className="h-4 w-4" /> Save Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
