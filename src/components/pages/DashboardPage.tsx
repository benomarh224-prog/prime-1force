'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  Focus,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { useGrowthStore } from '@/lib/growth-store';
import { useAppStore, type PageName } from '@/lib/store';

const week = [
  { day: 'Mon', score: 58, focus: 42 },
  { day: 'Tue', score: 72, focus: 58 },
  { day: 'Wed', score: 66, focus: 49 },
  { day: 'Thu', score: 84, focus: 71 },
  { day: 'Fri', score: 78, focus: 66 },
  { day: 'Sat', score: 91, focus: 82 },
  { day: 'Sun', score: 86, focus: 76 },
];

const actions: Array<{ label: string; detail: string; icon: typeof Target; page: PageName }> = [
  { label: 'Start focus', detail: '25 minute sprint', icon: Focus, page: 'focus' },
  { label: 'Write journal', detail: 'Reflect on today', icon: Brain, page: 'journal' },
  { label: 'Review goals', detail: 'Keep direction clear', icon: Target, page: 'goals' },
  { label: 'Continue learning', detail: 'Atomic Habits · 62%', icon: BookOpen, page: 'learning' },
];

export function DashboardPage() {
  const { data: session } = useSession();
  const { navigate } = useAppStore();
  const { habits, goals, xp, level, coins, focusMinutes, toggleHabit } = useGrowthStore();
  const done = habits.filter((habit) => habit.completed).length;
  const firstName = session?.user?.name?.split(' ')[0] || 'Houssam';
  const growthScore = Math.round(68 + done * 4.5);

  return (
    <div className="min-h-screen bg-[#050816] pb-28 pt-24 text-white lg:pb-12">
      <div className="pf-grid pointer-events-none fixed inset-0 opacity-[.13]" />
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-7 lg:px-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="pf-eyebrow">Tuesday, August 4 · Week 32</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Good afternoon, {firstName}.</h1>
            <p className="mt-3 text-slate-400">You&apos;re building momentum. Keep the promises you made to yourself today.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="min-w-0 rounded-xl border border-white/[.08] bg-white/[.035] px-3 py-2.5 sm:px-4">
              <p className="text-[10px] uppercase tracking-[.15em] text-slate-500">Level {level}</p>
              <p className="text-sm font-semibold text-sky-300">{xp.toLocaleString()} XP</p>
            </div>
            <div className="min-w-0 rounded-xl border border-white/[.08] bg-white/[.035] px-3 py-2.5 sm:px-4">
              <p className="text-[10px] uppercase tracking-[.15em] text-slate-500">Balance</p>
              <p className="text-sm font-semibold text-amber-300">{coins} coins</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Growth score', value: growthScore, suffix: '/100', detail: '+6 this week', icon: Sparkles, color: 'text-sky-300' },
            { label: 'Current streak', value: 16, suffix: ' days', detail: 'Personal best: 21', icon: Flame, color: 'text-orange-300' },
            { label: 'Focus time', value: (focusMinutes / 60).toFixed(1), suffix: ' hours', detail: '+42 min vs last week', icon: Clock3, color: 'text-indigo-300' },
            { label: 'Weekly XP', value: 485, suffix: ' XP', detail: '215 until reward', icon: Zap, color: 'text-amber-300' },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} key={metric.label} className="pf-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}<span className="text-sm font-normal text-slate-500">{metric.suffix}</span></p>
                  </div>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] ${metric.color}`}><Icon className="h-4 w-4" /></span>
                </div>
                <p className="mt-4 text-xs text-emerald-400">{metric.detail}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <section className="pf-card overflow-hidden p-5 sm:p-6">
              <div className="flex min-w-0 items-center justify-between gap-3">
              <div><p className="text-sm font-semibold">Momentum</p><p className="mt-1 text-xs text-slate-500">Your overall growth score this week</p></div>
              <button onClick={() => navigate('analytics')} className="text-xs font-medium text-sky-300 hover:text-sky-200">Full analytics</button>
            </div>
            <div className="mt-5 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={week} margin={{ left: -25, right: 4, top: 10 }}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a1025', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} fill="url(#growthFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="pf-card p-5 sm:p-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div><p className="text-sm font-semibold">Daily intention</p><p className="mt-1 text-xs text-slate-500">{done} of {habits.length} complete</p></div>
              <span className="text-sm font-semibold text-sky-300">{Math.round(done / habits.length * 100)}%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${done / habits.length * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" />
            </div>
            <div className="mt-5 space-y-2">
              {habits.map((habit) => (
                <button key={habit.id} onClick={() => toggleHabit(habit.id)} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-white/[.07] hover:bg-white/[.025]">
                  <span className={`grid h-6 w-6 place-items-center rounded-lg border transition ${habit.completed ? 'border-blue-500 bg-blue-600' : 'border-white/[.14] group-hover:border-blue-400/50'}`}>
                    {habit.completed && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`min-w-0 flex-1 text-sm ${habit.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{habit.title}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><Flame className="h-3 w-3 text-orange-400/80" />{habit.streak}</span>
                </button>
              ))}
            </div>
            <button onClick={() => navigate('habits')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[.11] py-2.5 text-xs font-medium text-slate-400 transition hover:border-blue-400/30 hover:text-sky-300">
              <Plus className="h-3.5 w-3.5" /> Manage habits
            </button>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <section className="pf-card p-5 sm:p-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div><p className="text-sm font-semibold">Active goals</p><p className="mt-1 text-xs text-slate-500">Direction for this season</p></div>
              <Target className="h-4 w-4 text-sky-300" />
            </div>
            <div className="mt-5 space-y-5">
              {goals.map((goal) => (
                <button key={goal.id} onClick={() => navigate('goals')} className="block w-full text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{goal.title}</p><p className="mt-1 text-[10px] text-slate-500">{goal.area} · {goal.deadline}</p></div>
                    <span className="text-xs font-semibold text-sky-300">{goal.progress}%</span>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${goal.progress}%` }} /></div>
                </button>
              ))}
            </div>
          </section>

          <section className="pf-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold">Your next best action</p><p className="mt-1 text-xs text-slate-500">Chosen from your priorities and energy</p></div>
              <span className="rounded-full border border-sky-300/15 bg-sky-400/[.07] px-2.5 py-1 text-[10px] font-semibold text-sky-300">AI curated</span>
            </div>
            <div className="mt-5 rounded-2xl border border-blue-300/[.12] bg-gradient-to-br from-blue-500/[.11] to-transparent p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-sky-300"><Focus className="h-5 w-5" /></span>
                <div className="flex-1"><p className="font-semibold">Protect a 50-minute launch sprint</p><p className="mt-1 text-sm leading-6 text-slate-400">Your energy and focus history suggest now is ideal for finishing the landing page copy.</p></div>
                <Button onClick={() => navigate('focus')} className="rounded-xl bg-blue-600 hover:bg-blue-500">Begin <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon;
                return <button key={action.label} onClick={() => navigate(action.page)} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-left transition hover:border-blue-400/20 hover:bg-blue-400/[.05]">
                  <Icon className="h-4 w-4 text-sky-300" /><p className="mt-3 text-xs font-medium">{action.label}</p><p className="mt-1 truncate text-[10px] text-slate-500">{action.detail}</p>
                </button>;
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { icon: Trophy, title: 'Consistency architect', copy: 'Complete every core habit for 7 days', value: '6/7 days', color: 'text-amber-300' },
            { icon: Award, title: 'Deep work initiate', copy: 'Log your first 10 focus hours', value: '8.3/10h', color: 'text-indigo-300' },
            { icon: CalendarDays, title: 'Weekly review', copy: 'Your review opens Sunday at 6 PM', value: 'In 5 days', color: 'text-emerald-300' },
          ].map((badge) => {
            const Icon = badge.icon;
            return <div key={badge.title} className="pf-card flex items-center gap-4 p-5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[.04] ${badge.color}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{badge.title}</p><p className="mt-1 truncate text-xs text-slate-500">{badge.copy}</p></div><span className="text-[10px] text-slate-500">{badge.value}</span></div>;
          })}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] px-4 py-4 sm:items-center sm:px-5">
          <Circle className="h-3 w-3 fill-sky-400 text-sky-400" />
          <p className="flex-1 text-sm italic text-slate-400">&ldquo;Success is the product of daily habits—not once-in-a-lifetime transformations.&rdquo;</p>
          <span className="hidden text-xs text-slate-600 sm:block">James Clear</span>
        </div>
      </div>
    </div>
  );
}
