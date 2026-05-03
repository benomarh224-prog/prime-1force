'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
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
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { progressData, dailyCalorieData, weeklySchedule, exercises } from '@/lib/data';
import {
  User, Target, Flame, TrendingDown, Calendar,
  Dumbbell, Trophy, Edit3, Save, X, Check,
  Weight, Ruler, Activity, Apple, Camera,
  Plus, Trash2, Clock, ClipboardList, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell,
} from 'recharts';

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

import type { WorkoutExercise } from '@/lib/store';

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

export function DashboardPage() {
  const store = useAppStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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

  const totalCaloriesBurned = dailyCalorieData.reduce((sum, d) => sum + d.burned, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const completedWorkoutsThisWeek = store.workoutLogs.filter(
    (log) => log.completed && new Date(`${log.date}T00:00:00`) >= startOfWeek
  ).length;
  const scheduledWorkoutsDone = weeklySchedule.filter((d) => d.done).length;
  const totalWorkouts = Math.max(completedWorkoutsThisWeek, scheduledWorkoutsDone);
  const bmi = store.userHeight > 0 ? (store.userWeight / (store.userHeight / 100) ** 2).toFixed(1) : '—';
  const currentStreak = 12;
  const weeklyProgress = store.weeklyGoal > 0 ? (totalWorkouts / store.weeklyGoal) * 100 : 0;

  const macroData = [
    { name: 'Protein', value: dailyCalorieData.reduce((s, d) => s + d.protein, 0) / 7, fill: 'oklch(0.72 0.19 155)' },
    { name: 'Carbs', value: dailyCalorieData.reduce((s, d) => s + d.carbs, 0) / 7, fill: 'oklch(0.75 0.12 60)' },
    { name: 'Fat', value: dailyCalorieData.reduce((s, d) => s + d.fat, 0) / 7, fill: 'oklch(0.60 0.15 250)' },
  ];

  const displayName = store.userName || 'Set Your Name';
  const avatar = getAvatarOption(store.userAvatar || 'emerald');

  const handleSave = () => {
    store.setUserProfile({
      name: editData.name.trim() || undefined,
      weight: editData.weight,
      height: editData.height,
      goal: editData.goal,
      level: editData.level,
      weeklyGoal: editData.weeklyGoal,
      avatar: editData.avatar,
    });
    setIsEditing(false);
    setShowAvatarPicker(false);
    toast({
      title: 'Profile saved!',
      description: 'Your changes have been saved successfully.',
    });
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

  const handleSaveWorkout = () => {
    if (!workoutForm.name.trim() || workoutForm.exercises.length === 0) {
      toast({ title: 'Missing info', description: 'Add a workout name and at least one exercise.', variant: 'destructive' });
      return;
    }
    store.addWorkoutLog({
      name: workoutForm.name.trim(),
      date: workoutForm.date,
      duration: workoutForm.duration,
      notes: workoutForm.notes.trim(),
      completed: false,
      exercises: workoutForm.exercises,
    });
    setShowWorkoutDialog(false);
    toast({ title: 'Workout logged!', description: `${workoutForm.name} saved with ${workoutForm.exercises.length} exercise${workoutForm.exercises.length > 1 ? 's' : ''}.` });
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Your <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">Track your fitness journey</p>
          </div>
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div key="edit-btn" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Button onClick={startEditing} className="rounded-xl gap-2">
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </Button>
              </motion.div>
            ) : (
              <motion.div key="save-btns" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2">
                <Button variant="ghost" onClick={handleCancel} className="rounded-xl gap-2">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} className="rounded-xl gap-2">
                  <Check className="h-4 w-4" /> Save
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
                      <AreaChart data={progressData}>
                        <defs>
                          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.72 0.19 155)" stopOpacity={0} />
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
                        <Area type="monotone" dataKey="weight" stroke="oklch(0.72 0.19 155)" fill="url(#weightGrad)" strokeWidth={2} />
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
                        <Bar dataKey="consumed" fill="oklch(0.72 0.19 155)" radius={[4, 4, 0, 0]} />
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
                    {isEditing && (
                      <Badge variant="outline" className="ml-auto text-xs text-primary border-primary/30">Editing</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="edit-mode"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Avatar Picker */}
                        <div className="space-y-2" ref={avatarPickerRef}>
                          <Label className="text-xs">Profile Icon</Label>
                          <div className="relative">
                            <button
                              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                              className="group flex items-center gap-3 w-full p-2 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                            >
                              <div className={cn(
                                'h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center text-lg ring-2 ring-offset-2 ring-offset-background transition-all',
                                `bg-gradient-to-br ${getAvatarOption(editData.avatar).gradient}`,
                                getAvatarOption(editData.avatar).ring,
                              )}>
                                {editData.name ? getInitials(editData.name) : getAvatarOption(editData.avatar).emoji}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium">
                                  {editData.name || 'Your Name'}
                                </p>
                                <p className="text-xs text-muted-foreground">Click to change icon</p>
                              </div>
                              <Camera className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>

                            {/* Picker Dropdown */}
                            <AnimatePresence>
                              {showAvatarPicker && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute z-50 top-full mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl p-3"
                                >
                                  <div className="grid grid-cols-4 gap-2">
                                    {avatarOptions.map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={() => {
                                          setEditData({ ...editData, avatar: opt.id });
                                          setShowAvatarPicker(false);
                                        }}
                                        className={cn(
                                          'h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center text-lg transition-all mx-auto',
                                          opt.gradient,
                                          editData.avatar === opt.id
                                            ? `ring-2 ring-offset-2 ring-offset-popover ${opt.ring} scale-110`
                                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                                        )}
                                      >
                                        {opt.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <Separator />

                        {/* Name Input */}
                        <div className="space-y-2">
                          <Label className="text-xs">Display Name</Label>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="Enter your name..."
                            className="h-9 rounded-lg"
                            maxLength={30}
                          />
                          {editData.name && (
                            <p className="text-[10px] text-muted-foreground">
                              Preview: {editData.name} ({getInitials(editData.name)})
                            </p>
                          )}
                        </div>

                        <Separator />

                        {/* Body Stats */}
                        <div className="space-y-2">
                          <Label className="text-xs">Weight (kg)</Label>
                          <Input
                            type="number"
                            value={editData.weight}
                            onChange={(e) => setEditData({ ...editData, weight: Number(e.target.value) })}
                            className="h-9 rounded-lg"
                            min={30}
                            max={300}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Height (cm)</Label>
                          <Input
                            type="number"
                            value={editData.height}
                            onChange={(e) => setEditData({ ...editData, height: Number(e.target.value) })}
                            className="h-9 rounded-lg"
                            min={100}
                            max={250}
                          />
                        </div>

                        <Separator />

                        {/* Goal & Level */}
                        <div className="space-y-2">
                          <Label className="text-xs">Fitness Goal</Label>
                          <Select value={editData.goal} onValueChange={(v) => setEditData({ ...editData, goal: v })}>
                            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lose_weight">Lose Weight</SelectItem>
                              <SelectItem value="gain_muscle">Build Muscle</SelectItem>
                              <SelectItem value="stay_fit">Stay Fit</SelectItem>
                              <SelectItem value="increase_endurance">Endurance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Fitness Level</Label>
                          <Select value={editData.level} onValueChange={(v) => setEditData({ ...editData, level: v })}>
                            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Weekly Goal (workouts)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            value={editData.weeklyGoal}
                            onChange={(e) => setEditData({ ...editData, weeklyGoal: Number(e.target.value) })}
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view-mode"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
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
                    )}
                  </AnimatePresence>
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
                  <div className="flex justify-center gap-4 mt-2">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Workout Tracker
                </CardTitle>
                <Button onClick={openWorkoutDialog} size="sm" className="rounded-lg gap-1.5 h-8 text-xs">
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
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{log.name}</p>
                            {log.completed && (
                              <Badge className="h-5 border-primary/20 bg-primary/10 text-primary text-[10px]">
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {log.duration > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{log.duration}m</span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />{log.exercises.length} exercises</span>
                          <button
                            onClick={() => store.completeWorkoutLog(log.id, !log.completed)}
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
                            onClick={() => store.deleteWorkoutLog(log.id)}
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

      {/* ═══════════ LOG WORKOUT DIALOG ═══════════ */}
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
            <div className="grid grid-cols-2 gap-3">
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
                className="h-9 rounded-lg w-32"
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
            <Button onClick={handleSaveWorkout} className="rounded-xl gap-2" disabled={!workoutForm.name.trim() || workoutForm.exercises.length === 0}>
              <Save className="h-4 w-4" /> Save Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
