'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Apple,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TodayDashboard } from '@/components/pages/TodayDashboard';
import { openAuthDialog } from '@/lib/auth-dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: 'easeOut' },
  }),
};

const sectionIntro: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const strengthPillars = [
  {
    icon: BookOpen,
    title: 'Learn the basics',
    text: 'Understand form, tempo, progressive overload, rest, and how each muscle group works.',
    accent: 'text-sky-300 bg-sky-400/10 border-sky-300/20',
  },
  {
    icon: Dumbbell,
    title: 'Train with purpose',
    text: 'Follow clear workouts for gym or home, with exercise details that make every set count.',
    accent: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    icon: Utensils,
    title: 'Eat for strength',
    text: 'Use simple nutrition guidance so your body has the protein, calories, and habits to grow.',
    accent: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20',
  },
  {
    icon: HeartPulse,
    title: 'Recover like an athlete',
    text: 'Build consistency with smart scheduling, sleep, mobility, and weekly progress tracking.',
    accent: 'text-amber-300 bg-amber-400/10 border-amber-300/20',
  },
];

const learningPath = [
  'Pick your level and main goal',
  'Learn the technique before lifting heavy',
  'Complete your weekly workout plan',
  'Track weight, reps, food, and energy',
  'Adjust with AI coaching when you get stuck',
];

const programCards = [
  {
    title: 'Beginner Strength',
    level: 'Start here',
    image: '/images/workout-barbell-squat.webp',
    stats: '3 days/week - full body',
    goal: 'Form first',
    cadence: '3 sessions',
    accent: 'from-primary to-amber-400',
  },
  {
    title: 'Muscle Builder',
    level: 'Hypertrophy',
    image: '/images/workout-bench-press.jpeg',
    stats: '4 days/week - upper/lower',
    goal: 'Volume work',
    cadence: '4 sessions',
    accent: 'from-sky-400 to-primary',
  },
  {
    title: 'Home Discipline',
    level: 'No equipment',
    image: '/images/workout-no-equip.png',
    stats: '30 min - bodyweight',
    goal: 'Daily habit',
    cadence: '30 minutes',
    accent: 'from-emerald-300 to-primary',
  },
];

const weeklyPlan = [
  { day: 'Mon', focus: 'Push strength', detail: 'Chest, shoulders, triceps', icon: Dumbbell },
  { day: 'Tue', focus: 'Learn and recover', detail: 'Mobility, form videos, walking', icon: BookOpen },
  { day: 'Wed', focus: 'Leg power', detail: 'Squat pattern, hamstrings, calves', icon: Flame },
  { day: 'Fri', focus: 'Pull and posture', detail: 'Back, biceps, rear delts', icon: Target },
];

const stats = [
  { value: '100+', label: 'exercises' },
  { value: '5', label: 'connected tools' },
  { value: '1', label: 'clear plan' },
];

function StarterPlanPreview() {
  const steps = [
    {
      icon: Target,
      title: 'Set your direction',
      text: 'Choose your goal, experience, equipment, and available training days.',
    },
    {
      icon: CalendarCheck2,
      title: 'Get your first week',
      text: 'Turn those answers into a realistic schedule with clear sessions and recovery.',
    },
    {
      icon: TrendingUp,
      title: 'Train and adapt',
      text: 'Log your work, review progress, and use the coach when the plan needs adjusting.',
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-primary/10 bg-muted/20 py-14 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,oklch(0.62_0.24_27_/_0.15),transparent_36%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <Badge className="mb-4 border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Built around your reality
          </Badge>
          <h2 className="text-3xl font-black tracking-normal sm:text-5xl">
            Get a training week you can actually follow.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
            Prime Forge connects your workouts, schedule, nutrition, progress, and coaching instead of leaving you
            to piece together five different apps.
          </p>
          <Button onClick={() => openAuthDialog('signup')} className="mt-7 h-12 rounded-lg px-6 font-black uppercase">
            Build My Plan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex gap-4 rounded-lg border border-white/[0.08] bg-card/80 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-primary">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { navigate, requestStartTodayWorkout } = useAppStore();
  const { status } = useSession();

  const startToday = () => {
    requestStartTodayWorkout();
    navigate('workouts');
  };

  return (
    <div className="overflow-hidden bg-background">
      <section className="relative min-h-[88svh] overflow-hidden bg-black text-white sm:min-h-[92svh]">
        <Image
          src="/images/hero-primeforge.webp"
          alt="Focused athlete training strength in a gym"
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[73%_center] sm:scale-100 sm:object-[62%_center] lg:object-[58%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.58)_34%,rgba(0,0,0,0.92)_100%)] sm:bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.80)_42%,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.72)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-[1400px] items-center px-4 pb-28 pt-24 sm:min-h-[92svh] sm:px-8 sm:pb-20 sm:pt-28 lg:px-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <motion.div initial="hidden" animate="visible" className="hero-copy-frame min-w-0 max-w-4xl">
              <motion.div variants={fadeUp} custom={0}>
                <Badge className="mb-6 border-white/15 bg-white/[0.08] px-3 py-1.5 text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Learn strength. Build discipline. Become harder to break.
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="max-w-5xl text-[2.35rem] font-black uppercase leading-[0.96] tracking-normal min-[380px]:text-[2.75rem] sm:text-7xl lg:text-[7.25rem]"
              >
                <span className="block">Forge A</span>
                <span className="block">Stronger You</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="hero-subcopy mt-5 text-[0.95rem] leading-7 text-white/78 sm:mt-6 sm:text-xl sm:leading-8"
              >
                Learn how to train, eat, recover, and stay consistent with a plan that connects every part
                of your progress. No random workouts, just a clear next step.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row"
              >
                <Button
                  size="lg"
                  onClick={startToday}
                  className="h-[3.15rem] w-full rounded-lg px-8 text-sm font-black uppercase sm:w-auto"
                >
                  Start Training
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('ai-coach')}
                  className="h-[3.15rem] w-full rounded-lg border-white/20 bg-black/30 px-8 text-sm font-black uppercase text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Bot className="h-4 w-4" />
                  Ask The Coach
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-8 grid w-full max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-white/[0.12] bg-black/40 backdrop-blur-md sm:mt-10 sm:w-full"
              >
                {stats.map((item) => (
                  <div key={item.label} className="border-r border-white/10 p-3 last:border-r-0 sm:p-5">
                    <p className="text-xl font-black text-primary sm:text-3xl">{item.value}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase text-white/58 sm:text-xs">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.65, ease: 'easeOut' }}
              className="hidden border border-white/[0.12] bg-black/[0.48] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-white/45">Today&apos;s mission</p>
                  <h2 className="mt-1 text-xl font-black">Upper Strength</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Dumbbell className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3 py-5">
                {[
                  ['Warm up', '8 min mobility'],
                  ['Main lift', 'Bench press 4 x 6'],
                  ['Skill', 'Controlled pulling tempo'],
                  ['Nutrition', '145g protein target'],
                ].map(([label, detail]) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg bg-white/6 p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{label}</p>
                      <p className="truncate text-xs text-white/56">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={startToday} className="h-12 w-full rounded-lg font-black uppercase">
                Begin Today
                <Play className="h-4 w-4 fill-current" />
              </Button>
            </motion.aside>
          </div>
        </div>
      </section>

      {status === 'authenticated' ? <TodayDashboard /> : <StarterPlanPreview />}

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionIntro}
            className="max-w-3xl"
          >
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              Strength school
            </Badge>
            <h2 className="text-3xl font-black tracking-normal sm:text-5xl">
              Everything a beginner needs to become confident in the gym.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              Learn the foundations before adding complexity. Every part of Prime Forge supports the same
              repeatable loop: learn, act, measure, improve.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {strengthPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeUp}
                  custom={index}
                >
                  <Card className="h-full py-0 transition-transform duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-lg border', pillar.accent)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-black">{pillar.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{pillar.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative min-h-[30rem] overflow-hidden rounded-lg"
          >
            <Image
              src="/images/trainer.png"
              alt="Trainer coaching exercise form"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/[0.82] via-black/[0.18] to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <Badge className="mb-4 border-white/15 bg-white/10 text-white">Coach mindset</Badge>
              <h2 className="max-w-md text-3xl font-black text-white sm:text-4xl">Train hard, but train smart first.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
                Better form, patient progression, and honest tracking beat motivation that lasts only one week.
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col justify-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={sectionIntro}
            >
              <Badge variant="secondary" className="mb-4">
                <Target className="h-3.5 w-3.5" />
                Your path
              </Badge>
              <h2 className="text-3xl font-black tracking-normal sm:text-5xl">A clear system for real progress.</h2>
            </motion.div>

            <div className="mt-8 space-y-3">
              {learningPath.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                  className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-card/70 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.12] text-sm font-black text-primary">
                    {index + 1}
                  </span>
                  <p className="font-semibold">{item}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('workouts')} className="h-12 rounded-lg font-bold">
                Explore Workouts
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('nutrition')} variant="outline" className="h-12 rounded-lg font-bold">
                Learn Nutrition
                <Apple className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionIntro}
            className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
          >
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4">
                <Zap className="h-3.5 w-3.5" />
                Training plans
              </Badge>
              <h2 className="text-3xl font-black tracking-normal sm:text-5xl">Choose a program and know what to do next.</h2>
            </div>
            <Button onClick={() => navigate('workouts')} variant="outline" className="h-12 rounded-lg font-bold">
              View all programs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {programCards.map((program, index) => (
              <motion.article
                key={program.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                custom={index}
                whileHover={{ y: -10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-card shadow-[0_16px_38px_oklch(0_0_0_/_0.20)]"
              >
                <motion.div
                  className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r opacity-80',
                    program.accent
                  )}
                  initial={{ scaleX: 0, transformOrigin: 'left' }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + index * 0.12, duration: 0.7, ease: 'easeOut' }}
                />
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-110 group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/[0.86] via-black/[0.18] to-transparent" />
                  <motion.div
                    className="absolute -inset-y-8 -left-24 w-16 rotate-12 bg-white/20 blur-md"
                    initial={{ x: -120 }}
                    whileHover={{ x: 560 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                  <Badge className="absolute left-4 top-4 border-white/15 bg-black/45 text-white backdrop-blur-sm">{program.level}</Badge>
                  <motion.div
                    className="absolute bottom-4 right-4 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-right text-white backdrop-blur-md"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.35, ease: 'easeInOut' }}
                  >
                    <p className="text-[10px] font-bold uppercase text-white/55">Goal</p>
                    <p className="text-xs font-black">{program.goal}</p>
                  </motion.div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{program.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{program.stats}</p>
                    </div>
                    <div className="rounded-lg bg-primary/[0.10] px-2.5 py-1 text-xs font-black text-primary">
                      {program.cadence}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('workouts')}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80"
                  >
                    Start this path
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionIntro}
          >
            <Badge variant="secondary" className="mb-4">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Weekly structure
            </Badge>
            <h2 className="text-3xl font-black tracking-normal sm:text-5xl">Consistency gets easier when the week is already planned.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              The schedule page helps users stop guessing. They can see what to train, when to recover,
              and how every session connects to their bigger strength goal.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Timer, title: 'Short sessions', text: 'Plans fit real days, not fantasy calendars.' },
                { icon: TrendingUp, title: 'Progressive goals', text: 'Small weekly wins add up to visible strength.' },
                { icon: BarChart3, title: 'Honest tracking', text: 'Use the dashboard to see what is working.' },
                { icon: Bot, title: 'Coach support', text: 'Ask for swaps, explanations, and motivation.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-white/[0.08] bg-card/70 p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="self-center rounded-lg border border-white/10 bg-card p-5 shadow-[0_16px_38px_oklch(0_0_0_/_0.22)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Sample week</p>
                <h3 className="text-2xl font-black">Foundation Builder</h3>
              </div>
              <Badge className="bg-emerald-400/[0.12] text-emerald-200">Balanced</Badge>
            </div>
            <div className="space-y-3">
              {weeklyPlan.map((session) => {
                const Icon = session.icon;
                return (
                  <div key={session.day} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 rounded-lg bg-muted/35 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-background font-black text-primary">
                      {session.day}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold">{session.focus}</p>
                      <p className="truncate text-sm text-muted-foreground">{session.detail}</p>
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
            <Button onClick={() => navigate('schedule')} className="mt-5 h-12 w-full rounded-lg font-bold">
              Build My Week
              <CalendarCheck2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-24">
        <Image
          src="/images/workout-gym-luxe.jpg"
          alt="Gym training environment"
          fill
          sizes="100vw"
          className="object-cover opacity-[0.16]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.07_0.01_25_/_0.98),oklch(0.10_0.014_25_/_0.90),oklch(0.07_0.01_25_/_0.98))]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 border-white/15 bg-white/[0.08] text-white">
              <Flame className="h-3.5 w-3.5" />
              Start before you feel ready
            </Badge>
            <h2 className="text-3xl font-black tracking-normal text-white sm:text-5xl">
              The strongest version of you is built one honest session at a time.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
              Open the workouts, ask the coach what you do not understand, and let the dashboard show your progress.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={startToday} size="lg" className="h-[3.25rem] rounded-lg px-8 font-black uppercase">
                Start Today
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('dashboard')}
                size="lg"
                variant="outline"
                className="h-[3.25rem] rounded-lg border-white/20 bg-black/30 px-8 font-black uppercase text-white hover:bg-white/10 hover:text-white"
              >
                See Progress
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
