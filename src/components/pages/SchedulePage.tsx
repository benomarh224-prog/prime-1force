'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  History,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from 'lucide-react';

type Program = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type ScheduleDay = {
  id: string;
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
  dayName: string;
  splitTitle: string;
  completedAt: string;
};

type ScheduleResponse = {
  success: boolean;
  error?: string;
  persistence?: 'database' | 'disabled';
  programs: Program[];
  activeProgram: Program;
  days: ScheduleDay[];
  today: (ScheduleDay & { completed: boolean; completionId: string | null; date: string }) | null;
  history: Completion[];
};

const dayAccent = [
  'from-zinc-400 to-white',
  'from-emerald-300 to-white',
  'from-sky-300 to-white',
  'from-amber-300 to-white',
  'from-rose-300 to-white',
  'from-violet-300 to-white',
  'from-lime-300 to-white',
];

const fallbackProgram: Program = {
  id: 'fallback-program',
  name: 'Push / Pull / Legs',
  description: 'A balanced six-day split with one recovery day.',
  isActive: true,
};

const fallbackDays: ScheduleDay[] = [
  { id: 'fallback-0', dayOfWeek: 0, dayName: 'Sunday', splitTitle: 'Rest Day', exercises: [], notes: null, isRestDay: true },
  { id: 'fallback-1', dayOfWeek: 1, dayName: 'Monday', splitTitle: 'Push', exercises: ['Chest', 'Shoulders', 'Triceps'], notes: null, isRestDay: false },
  { id: 'fallback-2', dayOfWeek: 2, dayName: 'Tuesday', splitTitle: 'Pull', exercises: ['Back', 'Biceps', 'Rear Delts'], notes: null, isRestDay: false },
  { id: 'fallback-3', dayOfWeek: 3, dayName: 'Wednesday', splitTitle: 'Legs', exercises: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], notes: null, isRestDay: false },
  { id: 'fallback-4', dayOfWeek: 4, dayName: 'Thursday', splitTitle: 'Push', exercises: ['Chest', 'Shoulders', 'Triceps'], notes: null, isRestDay: false },
  { id: 'fallback-5', dayOfWeek: 5, dayName: 'Friday', splitTitle: 'Pull', exercises: ['Back', 'Biceps', 'Core'], notes: null, isRestDay: false },
  { id: 'fallback-6', dayOfWeek: 6, dayName: 'Saturday', splitTitle: 'Legs + Conditioning', exercises: ['Legs', 'Abs', 'Cardio'], notes: null, isRestDay: false },
];

const localScheduleKey = 'prime-forge-schedule-days';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getLocalScheduleDays() {
  if (typeof window === 'undefined') return fallbackDays;
  try {
    const saved = window.localStorage.getItem(localScheduleKey);
    if (!saved) return fallbackDays;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length === 7 ? parsed as ScheduleDay[] : fallbackDays;
  } catch {
    return fallbackDays;
  }
}

function saveLocalScheduleDays(days: ScheduleDay[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(localScheduleKey, JSON.stringify(days));
}

export function SchedulePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [today, setToday] = useState<ScheduleResponse['today']>(null);
  const [history, setHistory] = useState<Completion[]>([]);
  const [newProgramName, setNewProgramName] = useState('');
  const isFallbackProgram = activeProgram?.id === fallbackProgram.id;

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return history.filter((entry) => new Date(entry.date) >= start).length;
  }, [history]);

  const fetchSchedule = async (programId?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schedule${programId ? `?programId=${programId}` : ''}`);
      const data = (await response.json()) as ScheduleResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not load schedule');
      }

      setPrograms(data.programs);
      setActiveProgram(data.activeProgram);
      const nextDays = data.persistence === 'disabled' ? getLocalScheduleDays() : data.days;
      const todayDay = nextDays.find((day) => day.dayOfWeek === new Date().getDay()) ?? nextDays[0];
      setDays(nextDays);
      setToday(data.today && todayDay ? { ...todayDay, completed: data.today.completed, completionId: data.today.completionId, date: data.today.date } : data.today);
      setHistory(data.history);
    } catch (error) {
      const now = new Date();
      const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const fallbackToday = fallbackDays.find((day) => day.dayOfWeek === now.getDay()) ?? fallbackDays[0];

      setPrograms([fallbackProgram]);
      setActiveProgram(fallbackProgram);
      const localDays = getLocalScheduleDays();
      const localToday = localDays.find((day) => day.dayOfWeek === now.getDay()) ?? fallbackToday;
      setDays(localDays);
      setToday({ ...localToday, completed: false, completionId: null, date: dateOnly });
      setHistory([]);

      toast({
        title: 'Using saved local schedule',
        description: 'Your schedule is available in this browser.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const updateDay = (dayOfWeek: number, patch: Partial<ScheduleDay>) => {
    setDays((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day))
    );
  };

  const saveSchedule = async () => {
    if (!activeProgram) return;

    if (isFallbackProgram) {
      saveLocalScheduleDays(days);
      setToday((current) => {
        const todayDay = days.find((day) => day.dayOfWeek === new Date().getDay());
        return current && todayDay ? { ...todayDay, completed: current.completed, completionId: current.completionId, date: current.date } : current;
      });
      toast({
        title: 'Schedule saved',
        description: 'Your changes are saved in this browser.',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: activeProgram.id,
          days: days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            splitTitle: day.splitTitle,
            exercises: day.exercises,
            notes: day.notes,
            isRestDay: day.isRestDay,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Save failed');

      toast({ title: 'Schedule saved', description: 'Your weekly split is up to date.' });
      await fetchSchedule(activeProgram.id);
    } catch (error) {
      toast({
        title: 'Could not save schedule',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCompletion = async (day: ScheduleDay) => {
    if (!activeProgram) return;

    if (isFallbackProgram) {
      const nextCompleted = !today?.completed;
      setToday((current) => (current ? { ...current, completed: !current.completed } : current));
      toast({
        title: nextCompleted ? 'Workout completed' : 'Workout reopened',
        description: 'Today has been updated locally.',
      });
      return;
    }

    try {
      const response = await fetch('/api/schedule/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: activeProgram.id,
          dayOfWeek: day.dayOfWeek,
          date: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Completion update failed');

      toast({
        title: data.completed ? 'Workout completed' : 'Workout reopened',
        description: data.completed ? `${day.splitTitle} added to history.` : `${day.splitTitle} removed from today.`,
      });
      await fetchSchedule(activeProgram.id);
    } catch (error) {
      toast({
        title: 'Could not update completion',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const createProgram = async () => {
    if (!newProgramName.trim()) return;
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProgramName.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Program create failed');
      setNewProgramName('');
      toast({ title: 'Program created', description: `${data.program.name} is ready to edit.` });
      await fetchSchedule(data.program.id);
    } catch (error) {
      toast({
        title: 'Could not create program',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const setActiveProgramId = async (programId: string) => {
    try {
      await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, isActive: true }),
      });
      await fetchSchedule(programId);
    } catch {
      toast({ title: 'Could not switch program', variant: 'destructive' });
    }
  };

  const deleteProgram = async () => {
    if (!activeProgram) return;

    if (isFallbackProgram) {
      toast({
        title: 'Default program kept',
        description: 'Create database storage to manage multiple programs online.',
      });
      return;
    }

    try {
      const response = await fetch(`/api/schedule?programId=${activeProgram.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
      toast({ title: 'Program deleted' });
      await fetchSchedule();
    } catch (error) {
      toast({
        title: 'Could not delete program',
        description: error instanceof Error ? error.message : 'Please keep at least one program.',
        variant: 'destructive',
      });
    }
  };

  if (loading && days.length === 0) {
    return (
      <div className="min-h-screen bg-black pt-28 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 text-white sm:pt-24">
      <div className="absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_18%_5%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,#141414_0%,#000_100%)] sm:h-[520px]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8 flex flex-col justify-between gap-5 sm:gap-6 lg:flex-row lg:items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-3xl">
            <Badge className="mb-4 max-w-full rounded-sm border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white sm:mb-5 sm:text-xs">
              Weekly Training System
            </Badge>
            <h1 className="text-[2.65rem] font-black uppercase leading-[0.94] tracking-tight min-[390px]:text-5xl sm:text-6xl lg:text-7xl">
              Workout Schedule
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Assign splits to each day, see today&apos;s workout, mark sessions complete, and keep a permanent training history.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-80">
            <Button onClick={() => fetchSchedule(activeProgram?.id)} variant="outline" className="h-12 rounded-sm border-white/20 bg-white/5 text-white hover:bg-white hover:text-black">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={saveSchedule} disabled={saving} className="h-12 rounded-sm bg-white text-black hover:bg-white/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Schedule
            </Button>
          </div>
        </motion.div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                <Dumbbell className="h-4 w-4" />
                Today&apos;s Workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              {today && (
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase text-white/50">{formatDate(today.date)}</p>
                    <h2 className="mt-2 text-4xl font-black uppercase">{today.splitTitle}</h2>
                    <p className="mt-3 text-white/65">
                      {today.isRestDay ? 'Recovery day. Mobility, steps, and sleep still count.' : today.exercises.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCompletion(today)}
                    className={cn(
                      'flex min-h-24 min-w-48 items-center justify-center gap-3 rounded-sm border px-6 text-sm font-black uppercase transition-colors',
                      today.completed
                        ? 'border-emerald-300 bg-emerald-300 text-black'
                        : 'border-white/25 bg-transparent text-white hover:bg-white hover:text-black'
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {today.completed ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                <CalendarDays className="h-4 w-4" />
                Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={activeProgram?.id} onValueChange={setActiveProgramId}>
                <SelectTrigger className="border-white/15 bg-black/40 text-white">
                  <SelectValue placeholder="Choose program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  value={newProgramName}
                  onChange={(event) => setNewProgramName(event.target.value)}
                  placeholder="New program name"
                  className="border-white/15 bg-black/40 text-white placeholder:text-white/35"
                />
                <Button onClick={createProgram} className="rounded-sm bg-white text-black hover:bg-white/90">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={deleteProgram}
                variant="outline"
                className="w-full rounded-sm border-red-400/30 bg-red-400/10 text-red-100 hover:bg-red-400 hover:text-black"
              >
                <Trash2 className="h-4 w-4" />
                Delete Current Program
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Active Program', value: activeProgram?.name || 'Program' },
            { label: 'This Week', value: `${completedThisWeek} done` },
            { label: 'Training Days', value: `${days.filter((day) => !day.isRestDay).length}/7` },
            { label: 'History', value: `${history.length} logs` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
              <p className="text-xs uppercase tracking-wide text-white/45">{stat.label}</p>
              <p className="mt-2 truncate text-xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {days.map((day) => {
              const isToday = today?.dayOfWeek === day.dayOfWeek;
              const exercisesText = day.exercises.join(', ');

              return (
                <Card
                  key={day.id}
                  className={cn(
                    'overflow-hidden border-white/10 bg-white/[0.045] text-white backdrop-blur-sm',
                    isToday && 'border-white/60 shadow-[0_0_40px_rgba(255,255,255,0.10)]'
                  )}
                >
                  <div className={cn('h-1 bg-gradient-to-r', dayAccent[day.dayOfWeek])} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm uppercase tracking-wide text-white/55">
                          {day.dayName}
                        </CardTitle>
                        {isToday && <Badge className="mt-2 rounded-sm bg-white text-black">Today</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={day.isRestDay}
                          onCheckedChange={(checked) => updateDay(day.dayOfWeek, { isRestDay: Boolean(checked) })}
                        />
                        <span className="text-xs text-white/50">Rest</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-white/45">Split</Label>
                      <Input
                        value={day.splitTitle}
                        onChange={(event) => updateDay(day.dayOfWeek, { splitTitle: event.target.value })}
                        className="border-white/15 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-white/45">Muscle Groups / Exercises</Label>
                      <Textarea
                        value={exercisesText}
                        onChange={(event) =>
                          updateDay(day.dayOfWeek, {
                            exercises: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Chest, Shoulders, Triceps"
                        className="min-h-20 resize-none border-white/15 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-white/45">Notes</Label>
                      <Input
                        value={day.notes || ''}
                        onChange={(event) => updateDay(day.dayOfWeek, { notes: event.target.value })}
                        placeholder="Intensity, cardio, mobility..."
                        className="border-white/15 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    {isToday && (
                      <Button onClick={() => toggleCompletion(day)} className="w-full rounded-sm bg-white text-black hover:bg-white/90">
                        <CheckCircle2 className="h-4 w-4" />
                        {today?.completed ? 'Undo Today' : 'Complete Today'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit border-white/10 bg-white/[0.06] text-white backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                <History className="h-4 w-4" />
                Completion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="py-10 text-center text-white/50">
                  <Clock className="mx-auto mb-3 h-8 w-8" />
                  <p className="text-sm">No completed workouts yet.</p>
                </div>
              ) : (
                <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                  {history.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black uppercase">{entry.splitTitle}</p>
                          <p className="mt-1 text-xs text-white/50">{formatDate(entry.date)}</p>
                        </div>
                        <Badge className="rounded-sm bg-emerald-300 text-black">{entry.dayName}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-white/40">
                        Completed {new Date(entry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
