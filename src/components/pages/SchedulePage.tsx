'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  GripVertical,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAppStore, type WorkoutExercise, type WorkoutLog } from '@/lib/store';

type ScheduleDay = {
  id: string;
  dayOfWeek: number;
  dayName: string;
  splitTitle: string;
  focus: string;
  notes: string;
  isRestDay: boolean;
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

const scheduleKey = 'prime-forge-simple-schedule';

const defaultDays: ScheduleDay[] = [
  { id: 'sun', dayOfWeek: 0, dayName: 'Sun', splitTitle: 'Recovery', focus: 'Mobility, walk, stretch', notes: 'Keep it light.', isRestDay: true },
  { id: 'mon', dayOfWeek: 1, dayName: 'Mon', splitTitle: 'Push', focus: 'Chest, shoulders, triceps', notes: 'Start with your main press.', isRestDay: false },
  { id: 'tue', dayOfWeek: 2, dayName: 'Tue', splitTitle: 'Pull', focus: 'Back, biceps, rear delts', notes: 'Control every rep.', isRestDay: false },
  { id: 'wed', dayOfWeek: 3, dayName: 'Wed', splitTitle: 'Legs', focus: 'Quads, hamstrings, calves', notes: 'Warm up hips and knees.', isRestDay: false },
  { id: 'thu', dayOfWeek: 4, dayName: 'Thu', splitTitle: 'Upper', focus: 'Strength accessories', notes: 'Add weight only if clean.', isRestDay: false },
  { id: 'fri', dayOfWeek: 5, dayName: 'Fri', splitTitle: 'Conditioning', focus: 'Core, intervals, carries', notes: 'Finish strong, not sloppy.', isRestDay: false },
  { id: 'sat', dayOfWeek: 6, dayName: 'Sat', splitTitle: 'Full Body', focus: 'Squat, hinge, push, pull', notes: 'Optional pump work.', isRestDay: false },
];

const emptyForm = (): WorkoutForm => ({
  name: '',
  date: new Date().toISOString().slice(0, 10),
  duration: '45',
  exerciseName: '',
  sets: '3',
  reps: '10',
  weight: '',
  notes: '',
});

function readSchedule() {
  if (typeof window === 'undefined') return defaultDays;

  try {
    const saved = window.localStorage.getItem(scheduleKey);
    if (!saved) return defaultDays;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length === 7 ? (parsed as ScheduleDay[]) : defaultDays;
  } catch {
    return defaultDays;
  }
}

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function workoutVolume(log: WorkoutLog) {
  return log.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    0
  );
}

function SortableScheduleDay({
  day,
  isToday,
  onUpdate,
}: {
  day: ScheduleDay;
  isToday: boolean;
  onUpdate: (dayOfWeek: number, patch: Partial<ScheduleDay>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-muted/25 p-3 transition-colors',
        isToday && 'border-primary/60 bg-primary/10',
        isDragging && 'relative z-10 shadow-2xl ring-1 ring-primary/40'
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-primary active:cursor-grabbing"
            aria-label={`Drag ${day.dayName}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-sm font-black">
            {day.dayName}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase">{day.splitTitle || 'Training'}</p>
            {isToday && <p className="text-xs font-bold uppercase text-primary">Today</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={day.isRestDay}
            onCheckedChange={(checked) => onUpdate(day.dayOfWeek, { isRestDay: Boolean(checked) })}
          />
          <span className="text-xs text-muted-foreground">Rest</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[0.82fr_1.18fr]">
        <Input
          value={day.splitTitle}
          onChange={(event) => onUpdate(day.dayOfWeek, { splitTitle: event.target.value })}
          placeholder="Split"
        />
        <Input
          value={day.focus}
          onChange={(event) => onUpdate(day.dayOfWeek, { focus: event.target.value })}
          placeholder="Focus"
        />
      </div>
      <Input
        value={day.notes}
        onChange={(event) => onUpdate(day.dayOfWeek, { notes: event.target.value })}
        placeholder="Notes"
        className="mt-2"
      />
    </div>
  );
}

export function SchedulePage() {
  const { toast } = useToast();
  const store = useAppStore();
  const [days, setDays] = useState<ScheduleDay[]>(() => readSchedule());
  const [form, setForm] = useState<WorkoutForm>(() => emptyForm());
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const todayIndex = new Date().getDay();
  const today = days.find((day) => day.dayOfWeek === todayIndex) ?? days[0];
  const todayLog = store.workoutLogs.find((log) => log.date === getDateKey());

  const stats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    const thisWeek = store.workoutLogs.filter((log) => new Date(`${log.date}T00:00:00`) >= start);
    const completedThisWeek = thisWeek.filter((log) => log.completed).length;
    const totalVolume = store.workoutLogs.reduce((sum, log) => sum + workoutVolume(log), 0);
    const totalMinutes = store.workoutLogs.reduce((sum, log) => sum + log.duration, 0);
    const trainingDays = days.filter((day) => !day.isRestDay).length;

    return {
      completedThisWeek,
      totalVolume,
      totalMinutes,
      trainingDays,
      weeklyProgress: trainingDays > 0 ? Math.min(100, (completedThisWeek / trainingDays) * 100) : 100,
    };
  }, [days, store.workoutLogs]);

  const updateDay = (dayOfWeek: number, patch: Partial<ScheduleDay>) => {
    setDays((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDays((current) => {
      const oldIndex = current.findIndex((day) => day.id === active.id);
      const newIndex = current.findIndex((day) => day.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const saveSchedule = () => {
    window.localStorage.setItem(scheduleKey, JSON.stringify(days));
    toast({
      title: 'Schedule saved',
      description: 'Your weekly plan is saved on this device.',
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
    toast({
      title: 'Reminders enabled',
      description: 'Prime Forge can now show browser workout reminders.',
    });
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
          `UID:prime-forge-${day.id}-${index}@primeforge.local`,
          `DTSTAMP:${formatIcsDate(new Date())}`,
          `DTSTART:${formatIcsDate(start)}`,
          `DTEND:${formatIcsDate(end)}`,
          `SUMMARY:Prime Forge - ${day.splitTitle || 'Workout'}`,
          `DESCRIPTION:${(day.focus || day.notes || 'Training session').replace(/\n/g, ' ')}`,
          'END:VEVENT',
        ].join('\r\n');
      })
      .join('\r\n');

    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prime Forge//Training Planner//EN', events, 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'prime-forge-training-plan.ics';
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar exported',
      description: 'Import the .ics file into Google Calendar, Apple Calendar, or Outlook.',
    });
  };

  const completeToday = () => {
    if (todayLog) {
      store.completeWorkoutLog(todayLog.id, !todayLog.completed);
      return;
    }

    const exercise: WorkoutExercise = {
      exerciseId: `quick-${today.id}`,
      exerciseName: today.focus || today.splitTitle,
      sets: [{ reps: 0, weight: 0 }],
    };

    store.addWorkoutLog({
      name: today.splitTitle,
      date: getDateKey(),
      duration: 0,
      notes: today.notes,
      completed: true,
      exercises: [exercise],
    });
  };

  const logWorkout = () => {
    const name = form.name.trim() || today.splitTitle;
    const exerciseName = form.exerciseName.trim() || today.focus || 'Workout';
    const setCount = Math.max(1, Number(form.sets) || 1);
    const reps = Math.max(0, Number(form.reps) || 0);
    const weight = Math.max(0, Number(form.weight) || 0);

    store.addWorkoutLog({
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
      ],
    });

    setForm(emptyForm());
    toast({
      title: 'Workout logged',
      description: `${name} was added to your tracker.`,
    });
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
              Tracker + Schedule
            </Badge>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
              Training Planner
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Plan the week, log today&apos;s work, and keep progress visible without any complicated setup.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={enableReminders} variant={remindersEnabled ? 'secondary' : 'outline'} className="h-12 rounded-lg font-bold">
              <Bell className="h-4 w-4" />
              {remindersEnabled ? 'Reminders On' : 'Enable Reminders'}
            </Button>
            <Button onClick={downloadCalendar} variant="outline" className="h-12 rounded-lg font-bold">
              <CalendarPlus className="h-4 w-4" />
              Export Calendar
            </Button>
            <Button onClick={saveSchedule} className="h-12 rounded-lg font-bold">
              <Save className="h-4 w-4" />
              Save Schedule
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'This Week', value: `${stats.completedThisWeek}/${stats.trainingDays}`, icon: CheckCircle2 },
            { label: 'Total Volume', value: `${Math.round(stats.totalVolume).toLocaleString()} kg`, icon: Activity },
            { label: 'Minutes Logged', value: `${stats.totalMinutes} min`, icon: Clock },
            { label: 'Sessions', value: `${store.workoutLogs.length}`, icon: ListChecks },
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

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <Flame className="h-4 w-4 text-primary" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {formatDate(getDateKey())}
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black uppercase">{today.splitTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {today.isRestDay ? 'Recovery day' : today.focus}
                    </p>
                  </div>
                  <Button
                    onClick={completeToday}
                    variant={todayLog?.completed ? 'secondary' : 'default'}
                    className="h-12 shrink-0 rounded-lg font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {todayLog?.completed ? 'Done' : 'Mark Done'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                    <span>Weekly progress</span>
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
                  Quick Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Workout</Label>
                    <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={today.splitTitle} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Main exercise</Label>
                  <Input value={form.exerciseName} onChange={(event) => setForm({ ...form, exerciseName: event.target.value })} placeholder="Bench press, squat, run..." />
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
                <Button onClick={logWorkout} className="h-12 w-full rounded-lg font-bold">
                  <Plus className="h-4 w-4" />
                  Log Workout
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Drag days to rearrange the plan. Edits are saved locally and can be exported to your calendar.
                </p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {days.map((day) => (
                        <SortableScheduleDay
                          key={day.id}
                          day={day}
                          isToday={day.dayOfWeek === todayIndex}
                          onUpdate={updateDay}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide">
                  <ListChecks className="h-4 w-4 text-primary" />
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
                              {formatDate(log.date)} · {log.duration || 0} min · {Math.round(workoutVolume(log)).toLocaleString()} kg
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => store.deleteWorkoutLog(log.id)}
                            aria-label="Delete workout"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
