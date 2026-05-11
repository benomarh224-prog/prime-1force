'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import { exercises } from '@/lib/data';
import { useAppStore, type WorkoutExercise, type WorkoutLog } from '@/lib/store';
import { cn } from '@/lib/utils';

type ProgramSummary = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
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

type Completion = {
  id: string;
  date: string;
  dayOfWeek: number;
  splitTitle: string;
  completedAt: string;
  dayName?: string;
};

type ScheduleResponse = {
  success: boolean;
  error?: string;
  programs?: ProgramSummary[];
  activeProgram?: ProgramSummary | null;
  days?: ScheduleDay[];
  today?: (ScheduleDay & { date: string; completed: boolean; completionId: string | null }) | null;
  history?: Completion[];
};

type WorkoutSessionsResponse = {
  success: boolean;
  error?: string;
  workoutLogs?: WorkoutLog[];
  workout?: WorkoutLog;
};

type WorkoutForm = {
  name: string;
  date: string;
  duration: string;
  exerciseName: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

type BuilderDraft = {
  name: string;
  goal: 'strength' | 'muscle' | 'fat-loss' | 'balanced';
  level: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: string;
  equipment: 'gym' | 'home' | 'no-equipment';
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const workoutDaysByCount: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
};

const defaultDays: ScheduleDay[] = dayNames.map((dayName, dayOfWeek) => ({
  dayOfWeek,
  dayName,
  splitTitle: dayOfWeek === 0 ? 'Rest Day' : 'Full Body',
  exercises: dayOfWeek === 0 ? [] : ['Leg Extension Machine', 'Chest Press Machine', 'Seated Row Machine'],
  notes: dayOfWeek === 0 ? 'Walk, stretch, and recover.' : 'Keep 1-2 reps in reserve.',
  isRestDay: dayOfWeek === 0,
}));

const exerciseName = (id: string, fallback: string) =>
  exercises.find((exercise) => exercise.id === id)?.name || fallback;

const programTemplates = {
  strength: [
    {
      splitTitle: 'Upper Strength',
      exercises: ['bench-press', 'shoulder-press-machine', 'seated-row-machine', 'bicep-curl'].map((id) => exerciseName(id, id)),
      notes: 'Work in the 3-6 rep range. Rest 2-3 minutes on heavy sets.',
    },
    {
      splitTitle: 'Lower Strength',
      exercises: ['barbell-squat', 'deadlift', 'leg-extension-machine', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Prioritize clean bracing, depth, and controlled warm-up sets.',
    },
    {
      splitTitle: 'Full Body Power',
      exercises: ['deadlift', 'bench-press', 'pull-ups', 'assisted-pull-up-machine'].map((id) => exerciseName(id, id)),
      notes: 'Move heavy, stay crisp, stop sets before form breaks.',
    },
  ],
  muscle: [
    {
      splitTitle: 'Push Hypertrophy',
      exercises: ['bench-press', 'shoulder-press-machine', 'chest-press-machine', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Use 8-12 reps with controlled tempo and a strong squeeze.',
    },
    {
      splitTitle: 'Pull Hypertrophy',
      exercises: ['pull-ups', 'deadlift', 'bicep-curl', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Control the lowering phase and chase quality volume.',
    },
    {
      splitTitle: 'Leg Hypertrophy',
      exercises: ['barbell-squat', 'leg-extension-machine', 'deadlift', 'assisted-pull-up-machine'].map((id) => exerciseName(id, id)),
      notes: 'Keep rest near 60-90 seconds on accessory work.',
    },
  ],
  'fat-loss': [
    {
      splitTitle: 'HIIT Conditioning',
      exercises: ['hiit-cardio', 'assisted-pull-up-machine', 'chest-press-machine', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Alternate hard intervals with enough rest to keep output high.',
    },
    {
      splitTitle: 'Strength Circuit',
      exercises: ['leg-extension-machine', 'chest-press-machine', 'pull-ups', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Move through the circuit smoothly. Rest 60 seconds between rounds.',
    },
    {
      splitTitle: 'Recovery Burn',
      exercises: ['shoulder-press-machine', 'hiit-cardio', 'seated-row-machine', 'leg-extension-machine'].map((id) => exerciseName(id, id)),
      notes: 'Keep intensity moderate and finish feeling better than you started.',
    },
  ],
  balanced: [
    {
      splitTitle: 'Full Body A',
      exercises: ['barbell-squat', 'chest-press-machine', 'pull-ups', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Train the main patterns and leave some energy in the tank.',
    },
    {
      splitTitle: 'Full Body B',
      exercises: ['deadlift', 'shoulder-press-machine', 'bicep-curl', 'leg-extension-machine'].map((id) => exerciseName(id, id)),
      notes: 'Balance strength work with mobility and steady effort.',
    },
    {
      splitTitle: 'Conditioning + Core',
      exercises: ['hiit-cardio', 'assisted-pull-up-machine', 'chest-press-machine', 'seated-row-machine'].map((id) => exerciseName(id, id)),
      notes: 'Keep transitions short and form sharp.',
    },
  ],
} satisfies Record<BuilderDraft['goal'], { splitTitle: string; exercises: string[]; notes: string }[]>;

const emptyForm = (): WorkoutForm => ({
  name: '',
  date: getDateKey(),
  duration: '45',
  exerciseName: '',
  sets: '3',
  reps: '10',
  weight: '',
  notes: '',
});

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

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return getDateKey(date);
}

function getWeekStart(dateKey: string) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return getDateKey(date);
}

function completionDateKey(completion: Completion) {
  return completion.date.slice(0, 10);
}

function workoutVolume(log: WorkoutLog) {
  return log.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    0
  );
}

function splitExerciseText(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeGeneratedDays(builder: BuilderDraft): ScheduleDay[] {
  const daysPerWeek = Math.max(2, Math.min(6, Number(builder.daysPerWeek) || 4));
  const activeDays = workoutDaysByCount[daysPerWeek] || workoutDaysByCount[4];
  const templates = programTemplates[builder.goal];
  let templateIndex = 0;

  return dayNames.map((dayName, dayOfWeek) => {
    if (!activeDays.includes(dayOfWeek)) {
      return {
        dayOfWeek,
        dayName,
        splitTitle: 'Rest Day',
        exercises: [],
        notes: builder.goal === 'fat-loss' ? 'Easy walk, mobility, and hydration.' : 'Recover, sleep, and prep your next session.',
        isRestDay: true,
      };
    }

    const template = templates[templateIndex % templates.length];
    templateIndex += 1;

    return {
      dayOfWeek,
      dayName,
      splitTitle: template.splitTitle,
      exercises: template.exercises,
      notes: `${template.notes} Level: ${builder.level}. Equipment: ${builder.equipment}.`,
      isRestDay: false,
    };
  });
}

export function SchedulePage() {
  const { toast } = useToast();
  const store = useAppStore();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [activeProgram, setActiveProgram] = useState<ProgramSummary | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [days, setDays] = useState<ScheduleDay[]>(defaultDays);
  const [history, setHistory] = useState<Completion[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingWorkoutId, setSyncingWorkoutId] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [form, setForm] = useState<WorkoutForm>(() => emptyForm());
  const [builder, setBuilder] = useState<BuilderDraft>({
    name: 'Generated Strength Program',
    goal: 'strength',
    level: 'intermediate',
    daysPerWeek: '4',
    equipment: 'gym',
  });

  const todayIndex = new Date().getDay();
  const today = days.find((day) => day.dayOfWeek === todayIndex) ?? days[0];
  const todayDateKey = getDateKey();
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedDay = days.find((day) => day.dayOfWeek === selectedDate.getDay()) ?? days[0];
  const selectedCompletion = history.find((item) => completionDateKey(item) === selectedDateKey);
  const selectedCompleted = Boolean(selectedCompletion);
  const selectedWeekStart = getWeekStart(selectedDateKey);
  const completionDates = useMemo(() => new Set(history.map(completionDateKey)), [history]);
  const weekPlan = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const dateKey = addDays(selectedWeekStart, index);
        const date = parseDateKey(dateKey);
        const day = days.find((item) => item.dayOfWeek === date.getDay()) ?? days[0];
        return {
          dateKey,
          day,
          completed: completionDates.has(dateKey),
        };
      }),
    [completionDates, days, selectedWeekStart]
  );

  const loadWorkoutSessions = async () => {
    const response = await fetch('/api/workout-sessions');
    const data = (await response.json()) as WorkoutSessionsResponse;
    if (!response.ok || !data.success) throw new Error(data.error || 'Could not load workouts');
    if (data.workoutLogs) store.setWorkoutLogs(data.workoutLogs);
  };

  const loadSchedule = async (programId?: string) => {
    setLoading(true);
    try {
      const query = programId ? `?programId=${encodeURIComponent(programId)}` : '';
      const response = await fetch(`/api/schedule${query}`);
      const data = (await response.json()) as ScheduleResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load schedule');

      setPrograms(data.programs || []);
      setActiveProgram(data.activeProgram || null);
      setSelectedProgramId(data.activeProgram?.id || programId || data.programs?.[0]?.id || '');
      setDays(data.days?.length ? data.days : defaultDays);
      setHistory(data.history || []);
    } catch (error) {
      toast({
        title: 'Could not load program',
        description: error instanceof Error ? error.message : 'The local planner is still visible.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
    loadWorkoutSessions().catch((error) => {
      toast({
        title: 'Could not load workout logs',
        description: error instanceof Error ? error.message : 'Existing local logs are still available.',
        variant: 'destructive',
      });
    });
  }, []);

  const stats = useMemo(() => {
    const weeklyCompletions = weekPlan.filter((item) => !item.day?.isRestDay && item.completed).length;
    const trainingDays = weekPlan.filter((item) => !item.day?.isRestDay).length;
    const totalVolume = store.workoutLogs.reduce((sum, log) => sum + workoutVolume(log), 0);
    const totalMinutes = store.workoutLogs.reduce((sum, log) => sum + log.duration, 0);
    let streak = 0;

    for (let offset = 0; offset < 90; offset += 1) {
      const dateKey = addDays(todayDateKey, -offset);
      const day = days.find((item) => item.dayOfWeek === parseDateKey(dateKey).getDay());
      if (day?.isRestDay) continue;
      if (!completionDates.has(dateKey)) break;
      streak += 1;
    }

    return {
      weeklyCompletions,
      trainingDays,
      totalVolume,
      totalMinutes,
      streak,
      weeklyProgress: trainingDays > 0 ? Math.min(100, (weeklyCompletions / trainingDays) * 100) : 100,
    };
  }, [completionDates, days, store.workoutLogs, todayDateKey, weekPlan]);

  const updateDay = (dayOfWeek: number, patch: Partial<ScheduleDay>) => {
    setDays((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  };

  const dayForDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    return days.find((day) => day.dayOfWeek === date.getDay()) ?? days[0];
  };

  const makeLocalCompletion = (dateKey: string, day: ScheduleDay): Completion => ({
    id: `local-completion-${dateKey}-${day.dayOfWeek}`,
    date: `${dateKey}T00:00:00.000Z`,
    dayOfWeek: day.dayOfWeek,
    splitTitle: day.splitTitle,
    completedAt: new Date().toISOString(),
    dayName: day.dayName,
  });

  const setCompletionForDate = async (
    dateKey: string,
    day: ScheduleDay,
    completed: boolean,
    options: { silent?: boolean } = {}
  ) => {
    if (!selectedProgramId || !day) return false;

    setSaving(true);
    try {
      const response = await fetch('/api/schedule/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgramId,
          dayOfWeek: day.dayOfWeek,
          date: dateKey,
          notes: day.notes,
          completed,
        }),
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        completed?: boolean;
        completion?: Completion | null;
      };
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not update completion');

      setHistory((current) => {
        const withoutDate = current.filter((item) => completionDateKey(item) !== dateKey);
        if (!data.completed) return withoutDate;

        const completion = data.completion || makeLocalCompletion(dateKey, day);
        return [completion, ...withoutDate].sort((a, b) => b.date.localeCompare(a.date));
      });

      if (!options.silent) {
        toast({
          title: data.completed ? 'Workout marked done' : 'Workout reopened',
          description: `${day.splitTitle} on ${formatDate(dateKey)} was updated.`,
        });
      }

      return Boolean(data.completed);
    } catch (error) {
      if (!options.silent) {
        toast({
          title: 'Could not update workout',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    if (!selectedProgramId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgramId,
          name: activeProgram?.name || builder.name,
          description: activeProgram?.description || `${builder.daysPerWeek} day ${builder.goal} program`,
          isActive: true,
          days,
        }),
      });
      const data = (await response.json()) as ScheduleResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not save schedule');

      if (data.days) setDays(data.days);
      if (data.activeProgram) setActiveProgram(data.activeProgram);
      await loadSchedule(selectedProgramId);
      toast({ title: 'Program saved', description: 'Your weekly training plan is now stored in the database.' });
    } catch (error) {
      toast({
        title: 'Could not save program',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAsNewProgram = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: builder.name.trim() || 'Generated Program',
          description: `${builder.daysPerWeek} day ${builder.goal} plan for ${builder.level} athletes`,
          isActive: true,
          days,
        }),
      });
      const data = (await response.json()) as ScheduleResponse & { program?: ProgramSummary & { days?: ScheduleDay[] } };
      if (!response.ok || !data.success || !data.program?.id) throw new Error(data.error || 'Could not create program');

      await loadSchedule(data.program.id);
      toast({ title: 'Program created', description: `${data.program.name} is now your active plan.` });
    } catch (error) {
      toast({
        title: 'Could not create program',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProgram = async () => {
    if (!selectedProgramId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/schedule?programId=${encodeURIComponent(selectedProgramId)}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as ScheduleResponse;
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not delete program');

      await loadSchedule();
      toast({ title: 'Program deleted', description: 'The next available program is now loaded.' });
    } catch (error) {
      toast({
        title: 'Could not delete program',
        description: error instanceof Error ? error.message : 'At least one program must remain.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const generateProgram = () => {
    setDays(makeGeneratedDays(builder));
    toast({
      title: 'Program generated',
      description: 'Review the week, tweak anything you want, then save it.',
    });
  };

  const enableReminders = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({
        title: 'Reminders unavailable',
        description: 'This browser does not support workout notifications.',
        variant: 'destructive',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast({
        title: 'Notifications blocked',
        description: 'Allow notifications in your browser to receive workout reminders.',
        variant: 'destructive',
      });
      return;
    }

    setRemindersEnabled(true);
    new Notification('Prime Forge reminders enabled', {
      body: `Today is ${today.splitTitle}. Your plan is ready when you are.`,
    });
    toast({ title: 'Reminders enabled', description: 'Prime Forge can now show browser workout reminders.' });
  };

  const downloadCalendar = () => {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(9, 0, 0, 0);

    const formatIcsDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const events = days
      .filter((day) => !day.isRestDay)
      .map((day, index) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() + ((day.dayOfWeek + 6) % 7));
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 60);

        return [
          'BEGIN:VEVENT',
          `UID:prime-forge-${selectedProgramId || 'program'}-${day.dayOfWeek}-${index}@primeforge.local`,
          `DTSTAMP:${formatIcsDate(new Date())}`,
          `DTSTART:${formatIcsDate(start)}`,
          `DTEND:${formatIcsDate(end)}`,
          `SUMMARY:Prime Forge - ${day.splitTitle || 'Workout'}`,
          `DESCRIPTION:${[...day.exercises, day.notes || ''].join(' | ').replace(/\n/g, ' ')}`,
          'END:VEVENT',
        ].join('\r\n');
      })
      .join('\r\n');

    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prime Forge//Program Builder//EN', events, 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'prime-forge-program.ics';
    anchor.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Calendar exported', description: 'Import the .ics file into your calendar app.' });
  };

  const toggleSelectedCompletion = () => {
    setCompletionForDate(selectedDateKey, selectedDay, !selectedCompleted);
  };

  const logWorkout = async () => {
    const name = form.name.trim() || today.splitTitle;
    const exerciseName = form.exerciseName.trim() || today.exercises[0] || today.splitTitle || 'Workout';
    const setCount = Math.max(1, Number(form.sets) || 1);
    const reps = Math.max(0, Number(form.reps) || 0);
    const weight = Math.max(0, Number(form.weight) || 0);
    const workout = {
      name,
      date: form.date,
      duration: Math.max(0, Number(form.duration) || 0),
      notes: form.notes.trim(),
      completed: true,
      exercises: [
        {
          exerciseId: `manual-${Date.now()}`,
          exerciseName,
          sets: Array.from({ length: setCount }, () => ({ reps, weight })),
        },
      ] satisfies WorkoutExercise[],
    };

    setSaving(true);
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout }),
      });
      const data = (await response.json()) as WorkoutSessionsResponse;
      if (!response.ok || !data.success || !data.workout) throw new Error(data.error || 'Could not save workout');

      store.upsertWorkoutLog(data.workout);
      const scheduledDay = dayForDate(form.date);
      if (scheduledDay && !scheduledDay.isRestDay) {
        await setCompletionForDate(form.date, scheduledDay, true, { silent: true });
      }
      setForm(emptyForm());
      toast({ title: 'Workout logged', description: `${name} was saved to your workout history.` });
    } catch (error) {
      toast({
        title: 'Could not save workout',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkout = async (log: WorkoutLog) => {
    setSyncingWorkoutId(log.id);
    store.deleteWorkoutLog(log.id);

    try {
      const response = await fetch(`/api/workout-sessions?workoutId=${encodeURIComponent(log.id)}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as WorkoutSessionsResponse;
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

  return (
    <div className="min-h-screen bg-background pt-20 text-foreground sm:pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-md border-primary/25 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-wide text-primary">
              Real Program Builder
            </Badge>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
              Training Planner
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Generate a plan, edit every training day, save it to the database, and log completed work.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => loadSchedule(selectedProgramId)} variant="outline" className="h-12 rounded-lg font-bold" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={enableReminders} variant={remindersEnabled ? 'secondary' : 'outline'} className="h-12 rounded-lg font-bold">
              <Bell className="h-4 w-4" />
              {remindersEnabled ? 'Reminders On' : 'Enable Reminders'}
            </Button>
            <Button onClick={downloadCalendar} variant="outline" className="h-12 rounded-lg font-bold">
              <CalendarPlus className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Selected Week', value: `${stats.weeklyCompletions}/${stats.trainingDays}`, icon: CheckCircle2 },
            { label: 'Training Streak', value: `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, icon: CalendarCheck2 },
            { label: 'Total Volume', value: `${Math.round(stats.totalVolume).toLocaleString()} kg`, icon: Activity },
            { label: 'Minutes Logged', value: `${stats.totalMinutes} min`, icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 truncate text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Program Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Saved program</Label>
                  <Select
                    value={selectedProgramId}
                    onValueChange={(value) => {
                      setSelectedProgramId(value);
                      loadSchedule(value);
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}{program.isActive ? ' - active' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Program name</Label>
                  <Input
                    value={builder.name}
                    onChange={(event) => setBuilder({ ...builder, name: event.target.value })}
                    placeholder="Program name"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select value={builder.goal} onValueChange={(value: BuilderDraft['goal']) => setBuilder({ ...builder, goal: value })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="muscle">Muscle gain</SelectItem>
                        <SelectItem value="fat-loss">Fat loss</SelectItem>
                        <SelectItem value="balanced">Balanced fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={builder.level} onValueChange={(value: BuilderDraft['level']) => setBuilder({ ...builder, level: value })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Days per week</Label>
                    <Select value={builder.daysPerWeek} onValueChange={(value) => setBuilder({ ...builder, daysPerWeek: value })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['2', '3', '4', '5', '6'].map((value) => (
                          <SelectItem key={value} value={value}>{value} days</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment</Label>
                    <Select value={builder.equipment} onValueChange={(value: BuilderDraft['equipment']) => setBuilder({ ...builder, equipment: value })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gym">Gym</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="no-equipment">No equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={generateProgram} variant="outline" className="h-12 rounded-lg font-bold">
                    <Sparkles className="h-4 w-4" />
                    Generate Week
                  </Button>
                  <Button onClick={saveAsNewProgram} className="h-12 rounded-lg font-bold" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save New
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  Week Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      const nextDate = addDays(selectedWeekStart, -7);
                      setSelectedDateKey(nextDate);
                      setForm((current) => ({ ...current, date: nextDate }));
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {formatDate(selectedWeekStart)} - {formatDate(addDays(selectedWeekStart, 6))}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      const nextDate = addDays(selectedWeekStart, 7);
                      setSelectedDateKey(nextDate);
                      setForm((current) => ({ ...current, date: nextDate }));
                    }}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {weekPlan.map(({ dateKey, day, completed }) => {
                    const isSelected = dateKey === selectedDateKey;
                    const isPastDue = dateKey < todayDateKey && !completed && !day?.isRestDay;
                    const status = day?.isRestDay ? 'Rest' : completed ? 'Done' : isPastDue ? 'Missed' : 'Planned';

                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          'grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_auto]',
                          isSelected && 'border-primary/60 bg-primary/10'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateKey(dateKey);
                            setForm((current) => ({ ...current, date: dateKey }));
                          }}
                          className="min-w-0 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black uppercase">{day?.dayName || formatDate(dateKey)}</span>
                            <Badge
                              variant={completed ? 'default' : isPastDue ? 'destructive' : 'secondary'}
                              className="rounded-md text-[10px] uppercase"
                            >
                              {status}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-sm font-bold">{day?.splitTitle || 'Workout'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(dateKey)}</p>
                        </button>

                        {!day?.isRestDay && (
                          <Button
                            variant={completed ? 'secondary' : 'outline'}
                            size="sm"
                            className="rounded-lg font-bold"
                            disabled={saving || !selectedProgramId}
                            onClick={() => setCompletionForDate(dateKey, day, !completed)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {completed ? 'Reopen' : 'Done'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <Flame className="h-4 w-4 text-primary" />
                  Workout Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-lg"
                    onClick={() => {
                      const nextDate = addDays(selectedDateKey, -1);
                      setSelectedDateKey(nextDate);
                      setForm((current) => ({ ...current, date: nextDate }));
                    }}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDateKey}
                    onChange={(event) => {
                      const nextDate = event.target.value || todayDateKey;
                      setSelectedDateKey(nextDate);
                      setForm((current) => ({ ...current, date: nextDate }));
                    }}
                    className="h-11 rounded-lg font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-lg"
                    onClick={() => {
                      const nextDate = addDays(selectedDateKey, 1);
                      setSelectedDateKey(nextDate);
                      setForm((current) => ({ ...current, date: nextDate }));
                    }}
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-lg font-bold sm:ml-auto"
                    onClick={() => {
                      setSelectedDateKey(todayDateKey);
                      setForm((current) => ({ ...current, date: todayDateKey }));
                    }}
                  >
                    Today
                  </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {formatDate(selectedDateKey)}
                      {selectedDateKey === todayDateKey ? ' - Today' : selectedDateKey > todayDateKey ? ' - Upcoming' : ' - Past'}
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black uppercase">{selectedDay?.splitTitle || 'Training'}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {selectedDay?.isRestDay ? 'Recovery day' : selectedDay?.exercises.join(', ') || 'No exercises yet'}
                    </p>
                  </div>
                  <Button
                    onClick={toggleSelectedCompletion}
                    variant={selectedCompleted ? 'secondary' : 'default'}
                    className="h-12 shrink-0 rounded-lg font-bold"
                    disabled={saving || !selectedProgramId}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedCompleted ? 'Reopen' : 'Mark Done'}
                  </Button>
                </div>
                {!selectedDay?.isRestDay && selectedDay?.exercises.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedDay.exercises.map((exercise) => (
                      <div key={exercise} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                        <CheckCircle2 className={cn('h-4 w-4', selectedCompleted ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="min-w-0 truncate">{exercise}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                    <span>Selected week progress</span>
                    <span>{Math.round(stats.weeklyProgress)}%</span>
                  </div>
                  <Progress value={stats.weeklyProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Quick Workout Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Workout</Label>
                    <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={today?.splitTitle || 'Workout'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(event) => {
                        const nextDate = event.target.value || todayDateKey;
                        setForm({ ...form, date: nextDate });
                        setSelectedDateKey(nextDate);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Main exercise</Label>
                  <Input value={form.exerciseName} onChange={(event) => setForm({ ...form, exerciseName: event.target.value })} placeholder={today?.exercises[0] || 'Bench press, squat, run...'} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input type="number" min={1} value={form.sets} onChange={(event) => setForm({ ...form, sets: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input type="number" min={0} value={form.reps} onChange={(event) => setForm({ ...form, reps: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kg</Label>
                    <Input type="number" min={0} value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Minutes</Label>
                    <Input type="number" min={0} value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder="Energy, pain, personal record, next target..."
                    className="min-h-20 resize-none"
                  />
                </div>
                <Button onClick={logWorkout} className="h-12 w-full rounded-lg font-bold" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Log Workout
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Weekly Program
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={deleteProgram} variant="outline" size="sm" className="rounded-lg" disabled={saving || programs.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                    <Button onClick={saveSchedule} size="sm" className="rounded-lg" disabled={saving || !selectedProgramId}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading program...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {days.map((day) => (
                      <div
                        key={day.dayOfWeek}
                        className={cn(
                          'rounded-lg border bg-muted/20 p-4 transition-colors',
                          day.dayOfWeek === todayIndex && 'border-primary/60 bg-primary/10'
                        )}
                      >
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background text-sm font-black">
                              {day.dayName.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black uppercase">{day.splitTitle}</p>
                              {day.dayOfWeek === todayIndex && <p className="text-xs font-bold uppercase text-primary">Today</p>}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox
                              checked={day.isRestDay}
                              onCheckedChange={(checked) =>
                                updateDay(day.dayOfWeek, {
                                  isRestDay: Boolean(checked),
                                  splitTitle: checked ? 'Rest Day' : day.splitTitle === 'Rest Day' ? 'Training' : day.splitTitle,
                                  exercises: checked ? [] : day.exercises,
                                })
                              }
                            />
                            Rest day
                          </label>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
                          <div className="space-y-2">
                            <Label className="text-xs">Split</Label>
                            <Input
                              value={day.splitTitle}
                              onChange={(event) => updateDay(day.dayOfWeek, { splitTitle: event.target.value })}
                              placeholder="Push, Pull, Legs..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Exercises</Label>
                            <Textarea
                              value={day.exercises.join('\n')}
                              onChange={(event) => updateDay(day.dayOfWeek, { exercises: splitExerciseText(event.target.value), isRestDay: false })}
                              placeholder="One exercise per line"
                              className="min-h-20 resize-none"
                            />
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">Notes</Label>
                          <Input
                            value={day.notes || ''}
                            onChange={(event) => updateDay(day.dayOfWeek, { notes: event.target.value })}
                            placeholder="Intensity, rest periods, progression..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <Target className="h-4 w-4 text-primary" />
                  Recent Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {store.workoutLogs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No workouts yet. Log one and your history appears here.
                  </div>
                ) : (
                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {store.workoutLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-black uppercase">{log.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(log.date)} - {log.duration || 0} min - {Math.round(workoutVolume(log)).toLocaleString()} kg
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWorkout(log)}
                            disabled={syncingWorkoutId === log.id}
                            aria-label="Delete workout"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            {syncingWorkoutId === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {log.exercises.map((exercise) => exercise.exerciseName).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  Completion History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Mark workouts done and your completed schedule appears here.
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {history.slice(0, 12).map((completion) => {
                      const dateKey = completionDateKey(completion);
                      const day = dayForDate(dateKey);

                      return (
                        <div key={completion.id} className="rounded-lg border bg-muted/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-black uppercase">{completion.splitTitle}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(dateKey)} - finished {new Date(completion.completedAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 shrink-0 rounded-lg text-muted-foreground"
                              disabled={saving || !selectedProgramId}
                              onClick={() => setCompletionForDate(dateKey, day, false)}
                            >
                              Reopen
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
