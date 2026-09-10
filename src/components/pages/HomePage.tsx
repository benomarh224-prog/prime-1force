'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Check, ChevronRight, Dumbbell, HeartPulse, Salad, Sparkles, Timer, Trophy } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName } from '@/lib/store';

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

const benefits: Array<{ icon: typeof Dumbbell; title: string; copy: string; page: PageName }> = [
  { icon: Dumbbell, title: 'Train with a plan', copy: 'Explore gym, home, and no-equipment workouts built around your level and goals.', page: 'workouts' },
  { icon: CalendarDays, title: 'Keep your week on track', copy: 'Set a program, see what is next, and turn every session into visible momentum.', page: 'schedule' },
  { icon: Salad, title: 'Fuel your progress', copy: 'Make nutrition simpler with meal ideas, insights, and a clearer view of your habits.', page: 'nutrition' },
];

const sessionSteps = [
  ['01', 'Choose a workout', 'Pick a session that fits your time, equipment, and training level.'],
  ['02', 'Train with confidence', 'Follow clear exercise guidance and log your sets as you go.'],
  ['03', 'See the work add up', 'Review consistency, build your streak, and take on your next challenge.'],
];

export function HomePage() {
  const { navigate } = useAppStore();
  const { status } = useSession();
  const start = () => status === 'authenticated' ? navigate('dashboard') : openAuthDialog('signup');

  return (
    <div className="overflow-hidden bg-[#05070b] text-white">
      <section className="relative isolate min-h-[720px] overflow-hidden">
        <Image src="/images/hero-primeforge.webp" alt="Athlete training with a dumbbell" fill priority sizes="100vw" className="object-cover object-[65%_center] sm:object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,11,.98)_0%,rgba(5,7,11,.88)_35%,rgba(5,7,11,.18)_76%,rgba(5,7,11,.38)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,11,1)_0%,transparent_35%,rgba(5,7,11,.2)_100%)]" />
        <div className="absolute -left-32 top-28 h-80 w-80 rounded-full bg-orange-500/15 blur-[110px]" />

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-5 pb-14 pt-32 sm:px-8 sm:pt-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-orange-100 backdrop-blur-md"><Sparkles className="h-3.5 w-3.5 text-orange-300" />TRAIN SMARTER. GET STRONGER.</div>
            <h1 className="mt-6 text-balance text-[clamp(3rem,8vw,6.7rem)] font-semibold leading-[.92] tracking-[-.065em]">Your next rep is <span className="text-orange-400">a new standard.</span></h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">Build a training routine you can actually keep. Workouts, schedules, nutrition, and progress—one place to get after it.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={start} size="lg" className="h-13 rounded-xl bg-orange-500 px-7 text-base font-semibold text-white shadow-[0_0_38px_rgba(249,115,22,.3)] hover:bg-orange-400">Start training <ArrowRight className="h-4 w-4" /></Button>
              <Button onClick={() => navigate('workouts')} size="lg" variant="outline" className="h-13 rounded-xl border-white/15 bg-white/[.06] px-7 text-base text-white backdrop-blur-md hover:bg-white/[.12] hover:text-white">Browse workouts</Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">{['Workout guidance', 'Flexible plans', 'Progress tracking'].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-orange-400" />{item}</span>)}</div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/[.08] bg-[#0a0d13]"><div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-3 sm:px-8">{[[Dumbbell, 'Workouts for every starting point', 'Gym, home, and bodyweight options'], [Timer, 'Make every session count', 'Clear exercises, sets, and pacing'], [Trophy, 'Built for steady progress', 'Stay consistent and celebrate wins']].map(([Icon, title, copy]) => { const I = Icon as typeof Dumbbell; return <div key={title as string} className="flex items-center gap-4 py-6 sm:px-6 sm:py-8"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><I className="h-5 w-5" /></span><div><p className="font-semibold">{title as string}</p><p className="mt-1 text-sm text-slate-500">{copy as string}</p></div></div>; })}</div></section>

      <section className="relative py-20 sm:py-32"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(249,115,22,.08),transparent_25%)]" /><div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div {...reveal} className="max-w-2xl"><p className="text-xs font-bold tracking-[.2em] text-orange-400">BUILT FOR THE WORK</p><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Everything you need to show up stronger.</h2><p className="mt-5 text-lg leading-8 text-slate-400">No complicated setup. Just the tools that make it easier to train, recover, and keep moving forward.</p></motion.div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">{benefits.map((benefit, index) => { const Icon = benefit.icon; return <motion.button {...reveal} transition={{ ...reveal.transition, delay: index * .08 }} key={benefit.title} onClick={() => navigate(benefit.page)} className="group rounded-2xl border border-white/[.09] bg-gradient-to-b from-white/[.065] to-white/[.02] p-7 text-left transition hover:-translate-y-1 hover:border-orange-300/25 hover:bg-white/[.06]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Icon className="h-6 w-6" /></span><h3 className="mt-7 text-2xl font-semibold tracking-tight">{benefit.title}</h3><p className="mt-3 max-w-sm leading-7 text-slate-400">{benefit.copy}</p><span className="mt-7 flex items-center gap-2 text-sm font-semibold text-orange-300">Explore <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></motion.button>; })}</div>
      </div></section>

      <section className="border-y border-white/[.08] bg-[#090c11] py-20 sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <motion.div {...reveal}><p className="text-xs font-bold tracking-[.2em] text-orange-400">A BETTER TRAINING LOOP</p><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Plan less. Train more.</h2><p className="mt-6 max-w-md text-lg leading-8 text-slate-400">A simple flow removes the friction between deciding to work out and actually doing it.</p><Button onClick={() => navigate('schedule')} variant="outline" className="mt-8 h-12 rounded-xl border-white/15 bg-white/[.04] px-5 text-white hover:bg-white/[.09] hover:text-white">View your schedule <ArrowRight className="h-4 w-4" /></Button></motion.div>
        <div className="grid gap-3">{sessionSteps.map(([number, title, copy], index) => <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * .1 }} key={number} className="flex gap-5 rounded-2xl border border-white/[.08] bg-white/[.025] p-5 sm:p-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-sm font-bold text-orange-300">{number}</span><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{copy}</p></div></motion.div>)}</div>
      </div></section>

      <section className="px-5 py-20 sm:px-8 sm:py-32"><motion.div {...reveal} className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-orange-300/15 bg-[linear-gradient(120deg,#1c100b,#100f12_50%,#0c1118)] px-6 py-16 text-center shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:px-12 sm:py-24"><div className="absolute -right-16 -top-20 h-80 w-80 rounded-full bg-orange-500/15 blur-[90px]" /><div className="relative mx-auto max-w-3xl"><HeartPulse className="mx-auto h-9 w-9 text-orange-400" /><h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Make training the part of your day you don&apos;t skip.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Start with one session. Build the routine that takes you where you want to go.</p><Button onClick={start} size="lg" className="mt-9 h-13 rounded-xl bg-orange-500 px-8 text-base font-semibold hover:bg-orange-400">Create your free account <ArrowRight className="h-4 w-4" /></Button></div></motion.div></section>
    </div>
  );
}
