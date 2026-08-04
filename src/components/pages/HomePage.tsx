'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  Flame,
  Focus,
  GraduationCap,
  HeartPulse,
  Layers3,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName } from '@/lib/store';

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: 'easeOut' as const },
};

const pillars: Array<{ icon: typeof Target; title: string; copy: string; page: PageName; tone: string }> = [
  { icon: CheckCircle2, title: 'Habit systems', copy: 'Design repeatable routines, protect your streaks, and turn consistency into identity.', page: 'habits', tone: 'from-sky-400/20' },
  { icon: Target, title: 'Meaningful goals', copy: 'Connect long-term ambition to milestones and the next clear action.', page: 'goals', tone: 'from-blue-500/20' },
  { icon: Focus, title: 'Deep focus', copy: 'Enter distraction-free work sprints and understand where your attention goes.', page: 'focus', tone: 'from-indigo-400/20' },
  { icon: Bot, title: 'AI personal coach', copy: 'Get context-aware guidance for discipline, career, confidence, health, and learning.', page: 'ai-coach', tone: 'from-cyan-400/20' },
  { icon: BrainCircuit, title: 'Reflection', copy: 'Journal with thoughtful prompts, mood signals, gratitude, and AI summaries.', page: 'journal', tone: 'from-violet-400/20' },
  { icon: GraduationCap, title: 'Learning hub', copy: 'Build reading lists, roadmaps, course plans, and a second brain that compounds.', page: 'learning', tone: 'from-blue-400/20' },
  { icon: Trophy, title: 'Challenges', copy: 'Use focused 7- and 30-day protocols to prove what you are capable of.', page: 'challenges', tone: 'from-amber-400/20' },
  { icon: HeartPulse, title: 'Whole-person health', copy: 'Keep fitness, nutrition, sleep, and recovery connected to the bigger picture.', page: 'fitness', tone: 'from-emerald-400/20' },
];

const stats = [
  ['47k+', 'people forging forward'],
  ['12.4M', 'habits completed'],
  ['2.8M', 'deep-work hours'],
  ['4.9/5', 'member rating'],
];

const journey = [
  { n: '01', title: 'Choose your direction', copy: 'Define the person you want to become across work, mind, health, and relationships.' },
  { n: '02', title: 'Build your system', copy: 'Prime Forge translates ambition into goals, habits, focus blocks, and weekly priorities.' },
  { n: '03', title: 'Act with clarity', copy: 'A focused daily command center shows the few actions that matter most right now.' },
  { n: '04', title: 'Review and evolve', copy: 'See patterns, learn from setbacks, earn XP, and adjust your system every week.' },
];

export function HomePage() {
  const { navigate } = useAppStore();
  const { status } = useSession();

  const start = () => status === 'authenticated' ? navigate('dashboard') : openAuthDialog('signup');

  return (
    <div className="relative overflow-hidden bg-[#050816] text-[#f8fafc]">
      <section className="relative min-h-[92svh] overflow-hidden pt-24 sm:pt-28">
        <div className="pf-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute left-[8%] top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute right-[8%] top-16 h-80 w-80 rounded-full bg-sky-400/15 blur-[120px]" />

        <div className="relative mx-auto grid min-h-[calc(92svh-7rem)] max-w-[1440px] items-center gap-14 px-5 pb-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/[0.08] px-3 py-1.5 text-xs font-semibold text-blue-100 shadow-[inset_0_1px_rgba(255,255,255,.08)] backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Your personal operating system for growth
            </div>
            <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.25rem,7vw,7.25rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
              Forge the person you were <span className="pf-gradient-text">meant to become.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-slate-300/75 sm:text-xl">
              Build discipline. Master your habits. Strengthen your mindset. Improve your health. Achieve meaningful goals. Become unstoppable.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={start} size="lg" className="h-13 rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,.32)] hover:bg-blue-500">
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} size="lg" variant="outline" className="h-13 rounded-xl border-white/12 bg-white/[0.045] px-7 text-white backdrop-blur-xl hover:bg-white/[0.08] hover:text-white">
                Explore features
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              {['Free to start', 'No credit card', 'Private by design'].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-sky-400" />{item}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .15, duration: .8 }} className="relative mx-auto w-full max-w-[620px]">
            <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-blue-500/15 blur-3xl" />
            <div className="pf-panel relative rounded-[1.75rem] p-3 shadow-[0_40px_120px_rgba(0,0,0,.48)]">
              <div className="rounded-[1.35rem] border border-white/[0.07] bg-[#070b1b]/95 p-4 sm:p-6">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[.18em] text-sky-300/70">Tuesday, August 4</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your daily forge</h2>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10">
                    <span className="text-lg font-semibold">82</span>
                    <span className="-mt-2 text-[8px] uppercase text-slate-400">score</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    [Flame, '16', 'day streak'],
                    [Clock3, '5.3h', 'focus'],
                    [Zap, '2,840', 'total XP'],
                  ].map(([Icon, value, label]) => {
                    const I = Icon as typeof Flame;
                    return <div key={label as string} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
                      <I className="h-4 w-4 text-sky-300" />
                      <p className="mt-3 text-lg font-semibold">{value as string}</p>
                      <p className="text-[10px] text-slate-500">{label as string}</p>
                    </div>;
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Today&apos;s momentum</p>
                    <span className="text-xs text-sky-300">3 of 5 complete</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ['90 min deep work', true, '12 days'],
                      ['Read 20 pages', true, '8 days'],
                      ['Strength session', false, '6 days'],
                      ['Evening reflection', false, '15 days'],
                    ].map(([title, done, streak]) => (
                      <div key={title as string} className="flex items-center gap-3">
                        <span className={`grid h-5 w-5 place-items-center rounded-md border ${done ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/15'}`}>
                          {done && <Check className="h-3 w-3" />}
                        </span>
                        <span className={`min-w-0 flex-1 text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{title as string}</span>
                        <span className="text-[10px] text-slate-500">{streak as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-500/10 to-transparent p-4">
                    <p className="text-[10px] uppercase tracking-[.15em] text-sky-300">AI insight</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Your strongest focus window is 9–11 AM. Protect it for the product launch.</p>
                  </div>
                  <button onClick={() => navigate('focus')} className="rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold transition hover:bg-blue-500">Start focus</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 sm:grid-cols-4 sm:px-8">
          {stats.map(([value, label]) => (
            <div key={label} className="px-3 py-8 text-center sm:py-10">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...reveal} className="max-w-3xl">
            <p className="pf-eyebrow">One system. Every dimension.</p>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.045em] sm:text-6xl">Everything you need to close the gap between intention and action.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Prime Forge brings your goals, habits, focus, learning, reflection, and health into one clear operating system.</p>
          </motion.div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.button {...reveal} transition={{ ...reveal.transition, delay: index * .045 }} key={pillar.title} onClick={() => navigate(pillar.page)} className="pf-card group relative overflow-hidden p-6 text-left">
                  <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${pillar.tone} to-transparent opacity-0 transition duration-500 group-hover:opacity-100`} />
                  <div className="relative">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-blue-300/15 bg-blue-400/[0.08] text-sky-300 transition group-hover:scale-110 group-hover:bg-blue-500/15">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 text-lg font-semibold">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{pillar.copy}</p>
                    <span className="mt-6 flex items-center gap-2 text-xs font-semibold text-sky-300 opacity-0 transition group-hover:opacity-100">Explore <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#070b19] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...reveal} className="text-center">
            <p className="pf-eyebrow">The Prime Forge method</p>
            <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-.045em] sm:text-6xl">A simple loop for extraordinary growth.</h2>
          </motion.div>
          <div className="relative mt-16 grid gap-4 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-blue-400/35 to-transparent lg:block" />
            {journey.map((step, index) => (
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * .08 }} key={step.n} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl border border-blue-300/20 bg-[#0a1129] text-sm font-semibold text-sky-300 shadow-[0_0_32px_rgba(37,99,235,.16)]">{step.n}</span>
                <h3 className="mt-7 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{step.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <motion.div {...reveal}>
            <p className="pf-eyebrow">Intelligence with context</p>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.045em] sm:text-6xl">A coach that learns how you operate.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-400">Not another generic chatbot. Your coach understands your goals, habits, focus patterns, reflections, and wins—then turns that context into the next useful move.</p>
            <Button onClick={() => navigate('ai-coach')} className="mt-8 h-12 rounded-xl bg-blue-600 px-6 hover:bg-blue-500">
              Meet your AI coach <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div {...reveal} className="pf-panel rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex items-center gap-4 border-b border-white/[0.08] pb-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 text-sky-300"><Bot className="h-5 w-5" /></span>
              <div><p className="font-semibold">Prime Coach</p><p className="text-xs text-emerald-400">Online · knows your journey</p></div>
            </div>
            <div className="space-y-4 py-6">
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6">I keep losing momentum after three productive days. What should I change?</div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-300">
                <p>Your data shows you schedule your hardest work on four consecutive days. The issue isn&apos;t discipline—it&apos;s recovery design.</p>
                <div className="mt-4 rounded-xl border border-sky-300/15 bg-blue-400/[0.06] p-3">
                  <p className="text-xs font-semibold text-sky-300">Try this tomorrow</p>
                  <p className="mt-1">Keep your 9 AM focus block, but make the afternoon a deliberate low-intensity reset. I&apos;ll adjust your week.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-slate-500">
              Ask anything about your growth…
              <ArrowRight className="ml-auto h-4 w-4 text-sky-300" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <motion.div {...reveal} className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-blue-300/15 bg-gradient-to-br from-blue-600/20 via-[#0a1025] to-[#06091a] px-6 py-16 text-center shadow-[0_40px_100px_rgba(0,0,0,.3)] sm:px-12 sm:py-24">
          <div className="pf-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative">
            <ShieldCheck className="mx-auto h-8 w-8 text-sky-300" />
            <h2 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-.045em] sm:text-6xl">Your future is built by what you do today.</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">Start building the system, identity, and momentum that make your best self inevitable.</p>
            <Button onClick={start} size="lg" className="mt-9 h-13 rounded-xl bg-white px-8 font-semibold text-[#071020] hover:bg-blue-50">
              Start forging for free <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
