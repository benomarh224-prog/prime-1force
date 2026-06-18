'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarCheck2,
  Dumbbell,
  Flame,
  HeartPulse,
  Play,
  ShieldCheck,
  Target,
  Timer,
  Utensils,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TodayDashboard } from '@/components/pages/TodayDashboard';
import { FutureShell, GlassPanel, MetricCard, ProgressRing, SectionHeading, TiltCard } from '@/components/future/FutureUI';
import { FutureScene } from '@/components/future/FutureScene';
import { openAuthDialog } from '@/lib/auth-dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const heroMetrics = [
  { label: 'Readiness', value: '94%', detail: 'AI-calibrated recovery', tone: 'cyan' as const, icon: <HeartPulse className="h-5 w-5" /> },
  { label: 'Power Output', value: '12.8k', detail: 'kg volume this week', tone: 'orange' as const, icon: <Flame className="h-5 w-5" /> },
  { label: 'Consistency', value: '6/7', detail: 'sessions on rhythm', tone: 'green' as const, icon: <CalendarCheck2 className="h-5 w-5" /> },
];

const systemPillars = [
  {
    icon: Brain,
    title: 'Adaptive intelligence',
    copy: 'PrimeForge turns training history, goals, and recovery signals into next-session decisions.',
  },
  {
    icon: Dumbbell,
    title: 'Precision workouts',
    copy: 'Exercise cards, form cues, rest timing, and progressive overload live in one fast interface.',
  },
  {
    icon: Utensils,
    title: 'Nutrition signal',
    copy: 'Meal guidance and macro context connect daily food choices to strength outcomes.',
  },
  {
    icon: BarChart3,
    title: 'Holographic progress',
    copy: 'Performance rings, streaks, PRs, and volume trends make progress instantly visible.',
  },
];

const programCards = [
  {
    title: 'Neural Strength',
    label: 'Beginner to intermediate',
    image: '/images/workout-bench-press.jpeg',
    progress: 78,
    detail: 'Upper power, clean technique, repeatable progression.',
  },
  {
    title: 'Hypertrophy Drive',
    label: 'Muscle architecture',
    image: '/images/workout-strength-luxe.jpg',
    progress: 86,
    detail: 'High-quality volume with AI-managed fatigue windows.',
  },
  {
    title: 'Mobility Engine',
    label: 'Recovery protocol',
    image: '/images/workout-no-equip.png',
    progress: 64,
    detail: 'Joint prep, breath control, and habit reinforcement.',
  },
];

const coachingSignals = [
  ['Form scan', 'Bar path looks stable. Add 2.5kg next week.'],
  ['Recovery', 'Sleep trend supports one heavier top set today.'],
  ['Nutrition', 'Protein target needs 31g before evening session.'],
];

export function HomePage() {
  const { navigate, requestStartTodayWorkout } = useAppStore();
  const { status } = useSession();

  const startToday = () => {
    requestStartTodayWorkout();
    navigate('workouts');
  };

  return (
    <FutureShell>
      <section className="relative overflow-hidden pt-20 text-white sm:pt-24">
        <FutureScene variant="hero" className="opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_28%,rgba(0,194,255,0.08)_0%,rgba(3,5,9,0.20)_38%,rgba(3,5,9,0.92)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background via-background/72 to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-[1440px] items-center gap-8 px-4 pb-14 sm:px-8 sm:pb-18 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            <Badge className="mb-4 border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-cyan-100 backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5" />
              Premium fitness command system
            </Badge>
            <h1 className="holo-text max-w-5xl text-[3.45rem] font-black uppercase leading-[0.86] tracking-normal min-[420px]:text-[4.35rem] sm:text-[7rem] lg:text-[8.6rem]">
              PrimeForge
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-xl sm:leading-9">
              An immersive AI fitness platform for training plans, live sessions, nutrition signals, and progress that feels
              sharp instead of noisy.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button onClick={startToday} size="lg" className="h-12 rounded-lg px-7 font-black uppercase shadow-[0_0_34px_rgba(0,194,255,0.24)]">
                Start Training
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('ai-coach')}
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border-white/15 bg-white/[0.06] px-7 font-black uppercase text-white backdrop-blur-xl hover:bg-white/10 hover:text-white"
              >
                <Bot className="h-4 w-4" />
                Talk to Coach
              </Button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
              {[
                ['3D', 'Live interface'],
                ['AI', 'Adaptive coach'],
                ['60fps', 'Fast motion'],
              ].map(([value, label]) => (
                <GlassPanel key={label} className="px-3 py-3 text-center sm:px-5 sm:py-4 sm:text-left">
                  <p className="text-xl font-black text-white sm:text-4xl">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/42 sm:text-xs">{label}</p>
                </GlassPanel>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.18, duration: 0.85, ease: 'easeOut' }}
            className="mx-auto w-full max-w-xl lg:block"
          >
            <GlassPanel intensity="strong" className="future-depth p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/58">Today protocol</p>
                  <h2 className="mt-2 text-xl font-black sm:text-2xl">Upper Strength</h2>
                </div>
                <ProgressRing value={84} label="ready" size={96} />
              </div>
              <div className="grid gap-3 py-4 sm:py-5">
                {[
                  ['Neural warmup', '8 min mobility and ramp sets', Timer],
                  ['Primary lift', 'Bench press 4 x 6 @ RPE 7', Dumbbell],
                  ['Coach cue', 'Keep wrists stacked over elbows', Target],
                ].map(([title, detail, Icon]) => {
                  const LucideIcon = Icon as typeof Dumbbell;
                  return (
                    <div key={title as string} className="rounded-xl border border-white/10 bg-white/[0.045] p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <span className="future-icon-glass grid h-10 w-10 place-items-center rounded-xl text-cyan-100">
                          <LucideIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-black">{title as string}</p>
                          <p className="text-sm text-white/52">{detail as string}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  ['4', 'lifts'],
                  ['90s', 'rest'],
                  ['31g', 'protein'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
                    <p className="text-lg font-black text-white">{value}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/42">{label}</p>
                  </div>
                ))}
              </div>
              <Button onClick={startToday} className="h-12 w-full rounded-lg font-black uppercase">
                Launch Session
                <Play className="h-4 w-4 fill-current" />
              </Button>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      {status === 'authenticated' ? (
        <div className="relative z-10">
          <TodayDashboard />
        </div>
      ) : (
        <section className="relative z-10 border-y border-white/10 bg-white/[0.025] py-12 sm:py-18">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8">
            <SectionHeading
              eyebrow="PrimeForge OS"
              title="A premium command center for every decision before, during, and after training."
              copy="Built for clarity first: immersive where it helps, restrained where you need to act fast."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Advanced 3D UI"
              title="Floating glass modules with usable depth."
              copy="Every panel is designed to feel alive while staying readable under pressure."
            />
            <Button onClick={() => navigate('dashboard')} variant="outline" className="h-11 rounded-lg border-white/15 bg-white/[0.04] font-bold text-white hover:bg-white/10">
              View Dashboard
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {systemPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <TiltCard key={pillar.title}>
                  <GlassPanel className="h-full p-5">
                    <div className={cn('future-orbit mb-5 grid h-12 w-12 place-items-center rounded-xl', index % 2 ? 'bg-orange-300/12 text-orange-200' : 'bg-cyan-300/12 text-cyan-100')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-white">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/56">{pillar.copy}</p>
                  </GlassPanel>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading eyebrow="Workout engine" title="3D exercise cards tuned for action." />
            <Button onClick={() => navigate('workouts')} className="h-11 rounded-lg font-black uppercase">
              Explore Workouts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mobile-card-scroller -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible">
            {programCards.map((program) => (
              <TiltCard key={program.title} className="min-w-[82vw] snap-start md:min-w-0">
                <GlassPanel className="group h-full overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={program.image} alt={program.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
                    <Badge className="absolute left-4 top-4 border-white/15 bg-black/40 text-white backdrop-blur-xl">{program.label}</Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-white">{program.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/56">{program.detail}</p>
                      </div>
                      <ProgressRing value={program.progress} label="load" size={86} />
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('workouts')}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase text-cyan-100 transition hover:text-orange-200"
                    >
                      Open protocol
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </GlassPanel>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden py-14 sm:py-20">
        <FutureScene variant="compact" className="left-auto right-0 w-full opacity-45 lg:w-1/2" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
          <SectionHeading
            eyebrow="AI Coach"
            title="A holographic coach that understands your training state."
            copy="Ask for swaps, form cues, nutrition targets, motivation, or a full weekly plan without losing context."
          />
          <GlassPanel intensity="strong" className="p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="future-icon-glass grid h-12 w-12 place-items-center rounded-xl text-cyan-100">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/58">Coach stream</p>
                <h3 className="text-xl font-black text-white">Live recommendations</h3>
              </div>
            </div>
            <div className="space-y-3">
              {coachingSignals.map(([label, text]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200/70">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate('ai-coach')} className="mt-5 h-12 w-full rounded-lg font-black uppercase">
              Enter AI Coach
              <Zap className="h-4 w-4" />
            </Button>
          </GlassPanel>
        </div>
      </section>
    </FutureShell>
  );
}
