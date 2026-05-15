'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Apple,
  ArrowRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName, type WorkoutLog } from '@/lib/store';
import { cn } from '@/lib/utils';

type TodayPlan = {
  dayOfWeek: number;
  dayName: string;
  splitTitle: string;
  exercises: string[];
  notes: string | null;
  isRestDay: boolean;
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
  today?: TodayPlan | null;
  history?: Array<{
    date: string;
    completedAt: string;
  }>;
};

type WorkoutSessionsResponse = {
  success: boolean;
  error?: string;
  workoutLogs?: WorkoutLog[];
};

function getDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function calculateTargetCalories(weight: number, height: number, goal: string) {
  const baseline = 10 * weight + 6.25 * height - 5 * 25 + 5;
  const maintenance = baseline * 1.55;

  if (goal === 'lose_weight') return Math.round(maintenance - 450);
  if (goal === 'gain_muscle') return Math.round(maintenance + 300);
  return Math.round(maintenance);
}

function getGoalCopy(goal: string) {
  if (goal === 'lose_weight') return 'fat loss';
  if (goal === 'gain_muscle') return 'muscle gain';
  if (goal === 'increase_endurance') return 'endurance';
  return 'maintenance';
}

function statCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-background/70', tone)}>
          {icon}
        </span>
        <span className="text-right text-[10px] font-black uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function TodayDashboard() {
  const {
    navigate,
    requestStartTodayWorkout,
    workoutLogs,
    setWorkoutLogs,
    userName,
    userWeight,
    userHeight,
    userGoal,
    weeklyGoal,
  } = useAppStore();
  const { data: session, status } = useSession();
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [programName, setProgramName] = useState('Your program');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadToday() {
      setLoading(true);

      try {
        const [scheduleResponse, sessionsResponse] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/workout-sessions'),
        ]);
        const schedule = (await scheduleResponse.json()) as ScheduleResponse;
        const sessions = (await sessionsResponse.json()) as WorkoutSessionsResponse;

        if (!mounted) return;

        if (scheduleResponse.ok && schedule.success) {
          setTodayPlan(schedule.today || null);
          setProgramName(schedule.activeProgram?.name || 'Your program');
        }

        if (sessionsResponse.ok && sessions.success && sessions.workoutLogs) {
          setWorkoutLogs(sessions.workoutLogs);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadToday();

    return () => {
      mounted = false;
    };
  }, [setWorkoutLogs]);

  const todayDateKey = getDateKey();
  const displayName = session?.user?.name || userName || session?.user?.email?.split('@')[0] || 'Athlete';
  const isSignedIn = status === 'authenticated';
  const targetCalories = calculateTargetCalories(userWeight, userHeight, userGoal);
  const completedLogs = workoutLogs.filter((log) => log.completed);
  const todayLogged = workoutLogs.some((log) => log.date === todayDateKey);
  const latestWorkout = workoutLogs[0];

  const metrics = useMemo(() => {
    const weekStart = getWeekStart();
    const weeklyLogs = workoutLogs.filter((log) => parseDateKey(log.date) >= weekStart);
    const weeklyCompleted = weeklyLogs.filter((log) => log.completed).length;
    const weeklyMinutes = weeklyLogs.reduce((sum, log) => sum + log.duration, 0);
    const weeklyVolume = weeklyLogs.reduce(
      (sum, log) =>
        sum +
        log.exercises.reduce(
          (exerciseSum, exercise) =>
            exerciseSum + exercise.sets.reduce((setSum, set) => setSum + set.weight * set.reps, 0),
          0
        ),
      0
    );
    const completedDateKeys = new Set(completedLogs.map((log) => log.date));
    let streak = 0;

    for (let i = 0; i < 45; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      if (!completedDateKeys.has(getDateKey(date))) break;
      streak += 1;
    }

    return {
      weeklyCompleted,
      weeklyMinutes,
      weeklyVolume,
      weeklyProgress: weeklyGoal > 0 ? Math.min(100, (weeklyCompleted / weeklyGoal) * 100) : 0,
      streak,
    };
  }, [completedLogs, weeklyGoal, workoutLogs]);

  const todayStatus = todayPlan?.isRestDay
    ? 'Recovery'
    : todayPlan?.completed || todayLogged
      ? 'Complete'
      : 'Ready';
  const primaryAction: { label: string; page: PageName } = todayPlan?.isRestDay
    ? { label: 'Plan Next Session', page: 'schedule' }
    : todayPlan?.completed || todayLogged
      ? { label: 'View Progress', page: 'dashboard' }
      : { label: 'Start Today', page: 'workouts' };
  const handlePrimaryAction = () => {
    if (primaryAction.page === 'workouts') {
      requestStartTodayWorkout();
    }

    navigate(primaryAction.page);
  };

  return (
    <section className="relative overflow-hidden border-y border-primary/10 bg-muted/20 py-16 sm:py-20">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_0%,oklch(0.78_0.125_72_/_0.13),transparent_34%),radial-gradient(circle_at_82%_20%,oklch(0.70_0.13_155_/_0.1),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <Badge className="mb-4 gap-2 rounded-md border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Today Command Center
            </Badge>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
              Welcome back, <span className="gradient-text">{displayName}</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Your workout, nutrition target, streak, and next best action in one place.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {!isSignedIn && (
              <Button
                variant="outline"
                onClick={() => openAuthDialog('signup')}
                className="h-11 rounded-lg border-primary/25 font-bold"
              >
                Save My Progress
              </Button>
            )}
            <Button onClick={handlePrimaryAction} className="h-11 rounded-lg font-bold neon-glow">
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-primary/15 bg-card/80">
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
                <div className="p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                        {programName}
                      </p>
                      <h3 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
                        {loading ? 'Loading today' : todayPlan?.splitTitle || 'Build your first plan'}
                      </h3>
                    </div>
                    <Badge
                      variant={todayStatus === 'Complete' ? 'default' : 'secondary'}
                      className="rounded-md text-[10px] uppercase"
                    >
                      {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {todayStatus}
                    </Badge>
                  </div>

                  <div className="mb-6 grid gap-2 sm:grid-cols-2">
                    {(todayPlan?.exercises.length ? todayPlan.exercises : ['Choose a program', 'Log your first workout', 'Ask the coach for a plan'])
                      .slice(0, 6)
                      .map((exercise) => (
                        <div key={exercise} className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                          <CheckCircle2 className={cn('h-4 w-4 shrink-0', todayStatus === 'Complete' ? 'text-primary' : 'text-muted-foreground')} />
                          <span className="truncate">{exercise}</span>
                        </div>
                      ))}
                  </div>

                  <p className="mb-5 text-sm leading-6 text-muted-foreground">
                    {todayPlan?.isRestDay
                      ? todayPlan.notes || 'Recover, walk, stretch, and get ready for the next training day.'
                      : todayPlan?.notes || 'Keep the first set controlled, then build intensity while your form stays sharp.'}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={handlePrimaryAction} className="rounded-lg font-bold">
                      <Dumbbell className="h-4 w-4" />
                      {primaryAction.label}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('ai-coach')} className="rounded-lg border-primary/20 font-bold">
                      <Bot className="h-4 w-4" />
                      Ask Coach
                    </Button>
                  </div>
                </div>

                <div className="border-t bg-muted/20 p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Weekly target</p>
                    <Badge variant="outline" className="rounded-md">
                      {metrics.weeklyCompleted}/{weeklyGoal}
                    </Badge>
                  </div>
                  <Progress value={metrics.weeklyProgress} className="h-2.5" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {Math.round(metrics.weeklyProgress)}% complete this week.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Minutes
                      </span>
                      <span className="font-black">{metrics.weeklyMinutes}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4 text-primary" />
                        Volume
                      </span>
                      <span className="font-black">{Math.round(metrics.weeklyVolume).toLocaleString()}kg</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flame className="h-4 w-4 text-primary" />
                        Streak
                      </span>
                      <span className="font-black">{metrics.streak}d</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {statCard({
              icon: <Target className="h-5 w-5" />,
              label: 'Nutrition',
              value: `${targetCalories.toLocaleString()} cal`,
              detail: `Target for ${getGoalCopy(userGoal)}. Build meals in Nutrition Hub.`,
              tone: 'text-emerald-400',
            })}
            {statCard({
              icon: <CalendarCheck2 className="h-5 w-5" />,
              label: 'Latest',
              value: latestWorkout?.name || 'No workout yet',
              detail: latestWorkout ? `${latestWorkout.duration || 0} min on ${latestWorkout.date}` : 'Start one session and your history begins.',
              tone: 'text-amber-400',
            })}
            {statCard({
              icon: <Apple className="h-5 w-5" />,
              label: 'Next Step',
              value: todayStatus === 'Complete' ? 'Refuel' : 'Train',
              detail: todayStatus === 'Complete' ? 'Hit protein and hydration before the day ends.' : 'Open today from Workouts and start logging sets.',
              tone: 'text-sky-400',
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
