'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TodayDashboard } from '@/components/pages/TodayDashboard';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { progressData } from '@/lib/data';
import {
  Bot, Dumbbell, BarChart3, Apple, ArrowRight, Zap, Target,
  Flame, TrendingUp, Shield, Heart,
  Activity, ChevronDown, Play, Award,
} from 'lucide-react';

/* ──────────────── animation helpers ──────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0, 0, 0.2, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

/* ──────────────── data ──────────────── */

const featureCards = [
  {
    icon: <Dumbbell className="h-6 w-6" />,
    title: 'Smart Workouts',
    description: 'AI-generated routines that adapt to your goals, fitness level, and available equipment in real-time.',
    gradient: 'from-emerald-500/10 to-emerald-500/0',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Progress Tracking',
    description: 'Advanced analytics with weekly charts, personal records, milestones, and body composition insights.',
    gradient: 'from-amber-500/10 to-amber-500/0',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'AI Coach',
    description: '24/7 intelligent coaching that provides form tips, motivation, and personalized adjustments.',
    gradient: 'from-primary/10 to-primary/0',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: <Apple className="h-6 w-6" />,
    title: 'Nutrition Plans',
    description: 'Custom meal plans with macro tracking, a 50+ food database, and calorie management tools.',
    gradient: 'from-rose-500/10 to-rose-500/0',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10',
  },
];

const faqItems = [
  {
    q: 'How does the AI Coach work?',
    a: 'Our AI Coach uses advanced machine learning to analyze your fitness profile, goals, and progress. It provides personalized workout suggestions, form corrections, nutrition advice, and motivational support — available 24/7.',
  },
  {
    q: 'Do I need gym equipment?',
    a: 'No! Prime Forge offers workouts for every setting — gym, home, or outdoor. Each exercise is tagged with equipment requirements so you can filter based on what you have available.',
  },
  {
    q: 'Can I track my nutrition?',
    a: 'Absolutely. Our nutrition tracker includes 50+ foods with detailed macro breakdowns. You can build custom meal plans, track daily calories, and get personalized suggestions based on your goals.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use enterprise-grade encryption, JWT authentication, and follow OWASP security best practices. Your fitness data is private and never shared with third parties.',
  },
  {
    q: 'What makes Prime Forge different from other fitness apps?',
    a: 'Prime Forge combines real-time AI coaching, adaptive workout plans, and comprehensive nutrition tracking in one platform. Our AI learns from your progress and continuously optimizes your plan.',
  },
  {
    q: 'Can I cancel my Pro plan anytime?',
    a: 'Yes, there are no contracts or hidden fees. You can cancel your Pro subscription at any time and continue using the Free plan indefinitely.',
  },
];

const beforeAfter = [
  {
    name: 'Sarah M.',
    time: '12 weeks',
    result: 'Lost 15kg',
    before: { weight: '78kg', bodyFat: '32%', waist: '88cm' },
    after: { weight: '63kg', bodyFat: '22%', waist: '72cm' },
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Marcus J.',
    time: '16 weeks',
    result: 'Gained 8kg muscle',
    before: { weight: '72kg', bench: '60kg', squat: '80kg' },
    after: { weight: '80kg', bench: '100kg', squat: '140kg' },
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Emma R.',
    time: '10 weeks',
    result: 'Complete transformation',
    before: { weight: '85kg', bodyFat: '35%', run: '0km' },
    after: { weight: '68kg', bodyFat: '21%', run: '5km' },
    gradient: 'from-amber-500 to-orange-600',
  },
];

/* ──────────────── FAQ Accordion Item ──────────────── */

function FAQItem({ item, isOpen, onToggle }: { item: typeof faqItems[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden transition-colors hover:border-border/80">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-5 text-left"
      >
        <span className="font-semibold text-sm pr-4">{item.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── QUOTE HERO SLIDER ──────────────── */

const quotes = [
  { quote: 'The body achieves what the mind believes.', author: 'Napoleon Hill', orb1: 'from-rose-500', orb2: 'from-orange-400', accent: 'text-rose-400' },
  { quote: 'Strength does not come from the body. It comes from the will.', author: 'Mahatma Gandhi', orb1: 'from-emerald-500', orb2: 'from-teal-400', accent: 'text-emerald-400' },
  { quote: "The only bad workout is the one that didn't happen.", author: 'Unknown', orb1: 'from-amber-500', orb2: 'from-yellow-400', accent: 'text-amber-400' },
  { quote: "Don't count the days, make the days count.", author: 'Muhammad Ali', orb1: 'from-primary', orb2: 'from-cyan-400', accent: 'text-primary' },
  { quote: 'Pain is temporary. Quitting lasts forever.', author: 'Lance Armstrong', orb1: 'from-red-500', orb2: 'from-rose-400', accent: 'text-red-400' },
  { quote: 'Success starts with self-discipline.', author: 'Unknown', orb1: 'from-sky-500', orb2: 'from-indigo-400', accent: 'text-sky-400' },
];

function QuoteSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % quotes.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + quotes.length) % quotes.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  const q = quotes[current];

  return (
    <section className="relative overflow-hidden border-y border-primary/10 bg-card/35 py-16 sm:py-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`motivation-bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
        >
          <Image
            src="/images/gym-machines.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.09_0.01_95)_0%,oklch(0.11_0.012_95_/_0.88)_48%,oklch(0.09_0.012_95)_100%)]" />
          <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50', q.accent)} />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <div className="relative z-10 w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div className="flex justify-center mb-6" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <Badge variant="secondary" className="px-4 py-1.5 bg-white/5 border-white/10 backdrop-blur-sm uppercase tracking-wide">
            <Flame className="h-3 w-3 mr-1.5" />
            Daily Motivation
          </Badge>
        </motion.div>

        <div className="relative flex flex-col items-center text-center min-h-[210px] sm:min-h-[230px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="w-full flex flex-col items-center"
            >
              <div className={cn('text-5xl sm:text-6xl font-serif leading-none mb-2 opacity-20 select-none', q.accent)}>
                &ldquo;
              </div>

              <p className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-4xl mb-7 text-balance">
                {q.quote}
              </p>

              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-border" />
                <p className="text-sm sm:text-base font-medium text-muted-foreground tracking-wide uppercase">
                  {q.author}
                </p>
                <div className="h-px w-8 bg-border" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-5 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prev}
            className="h-11 w-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
            aria-label="Previous quote"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div className="flex items-center gap-2">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="relative"
                aria-label={`Go to quote ${i + 1}`}
              >
                <span className={cn(
                  'block rounded-full transition-all duration-500',
                  i === current ? 'w-10 h-2.5 bg-primary shadow-sm shadow-primary/50' : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40',
                )} />
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={next}
            className="h-11 w-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
            aria-label="Next quote"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        <div className="max-w-xs mx-auto mt-6">
          <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: isPaused ? undefined : '100%' }}
              transition={isPaused ? {} : { duration: 5, ease: 'linear' }}
              key={current}
            />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-3 tabular-nums">
          {current + 1} / {quotes.length}
        </p>
      </div>
    </section>
  );
}

/* ──────────────── MAIN COMPONENT ──────────────── */

export function HomePage() {
  const { navigate } = useAppStore();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="overflow-hidden">

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative min-h-[92svh] overflow-hidden bg-black text-white">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/gym-hero.png"
            alt="Athlete training in a modern gym"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.78)_40%,rgba(0,0,0,0.24)_68%,rgba(0,0,0,0.72)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-[1400px] items-center px-4 pb-24 pt-24 sm:px-10 sm:pb-28 sm:pt-28 lg:px-16">
          <div className="hero-copy-frame min-w-0">
            <motion.div
              className="mb-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-primary sm:mb-9 sm:gap-7 sm:text-sm"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <span>Stronger Everyday</span>
              <span className="h-px w-16 bg-primary/70 sm:w-28" />
            </motion.div>

            <motion.h1
              className="max-w-full text-5xl font-black uppercase leading-[0.92] tracking-tight text-balance sm:text-7xl md:text-8xl lg:max-w-4xl lg:text-[8rem]"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1 }}
            >
              Build Your Best Self
            </motion.h1>

            <motion.p
              className="hero-subcopy mt-6 text-base leading-relaxed text-white/80 sm:mt-8 sm:text-xl"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22 }}
            >
              Personalized workouts, nutrition, and AI coaching in one place.
            </motion.p>

            <motion.div
              className="mt-9 flex w-full flex-col items-stretch gap-4 sm:mt-11 sm:w-auto sm:flex-row sm:items-center"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.34 }}
            >
              <Button size="lg" onClick={() => navigate('workouts')} className="h-14 min-w-52 rounded-lg px-10 text-sm font-black uppercase">
                Start Now
              </Button>
              <button
                type="button"
                onClick={() => navigate('ai-coach')}
                className="group flex h-14 items-center justify-center gap-4 rounded-lg border border-primary/15 bg-card/35 px-5 text-sm font-black uppercase text-white transition-colors hover:bg-primary/10 sm:justify-start sm:border-0 sm:bg-transparent sm:px-0"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-11 sm:w-11">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                See Demo
              </button>
            </motion.div>

            <motion.div
              className="mt-10 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-lg border border-primary/15 bg-black/35 shadow-2xl shadow-black/30 backdrop-blur-md sm:mt-14 sm:grid-cols-3"
              initial={false}
              animate="visible"
              variants={staggerContainer}
            >
              {[
                { icon: <Dumbbell className="h-7 w-7" />, title: 'Strength', text: 'Build power and confidence' },
                { icon: <Zap className="h-7 w-7 fill-current" />, title: 'Energy', text: 'Boost your daily performance' },
                { icon: <Heart className="h-7 w-7" />, title: 'Focus', text: 'Sharpen your mind and body' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i}
                  className="flex min-h-28 items-center gap-5 border-white/10 px-6 py-5 text-white sm:border-r sm:last:border-r-0"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</span>
                  <span>
                    <span className="block text-sm font-black uppercase">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/60">{item.text}</span>
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-7 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-primary/60" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════ DAILY MOTIVATION ═══════════ */}
      <QuoteSlider />
      <TodayDashboard />

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-4"><Zap className="h-3 w-3 mr-1" />Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything You Need to <span className="gradient-text">Crush Your Goals</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A complete fitness ecosystem built for results. From AI coaching to nutrition tracking — all in one premium platform.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((feature, i) => (
              <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} custom={i}>
                <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full border-border/50 relative overflow-hidden">
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500', feature.gradient)} />
                  <CardContent className="relative p-6">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-lg mb-5 transition-all duration-300 group-hover:scale-105', feature.iconBg, feature.iconColor)}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Inline CTA */}
          <motion.div className="text-center mt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Button size="lg" onClick={() => navigate('workouts')} className="neon-glow gap-2 font-semibold">
              Start Now <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
      <section className="py-16 sm:py-24 bg-muted/25">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
              <Badge variant="secondary" className="mb-4"><BarChart3 className="h-3 w-3 mr-1" />Dashboard</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Track Progress Like <span className="gradient-text">Never Before</span></h2>
              <p className="text-muted-foreground leading-relaxed mb-8">Get a bird&apos;s-eye view of your entire fitness journey. Monitor workouts, calories, streaks, and personal records — all in one beautifully designed dashboard.</p>
              <div className="space-y-5">
                {[
                  { icon: <TrendingUp className="h-5 w-5 text-primary" />, title: 'Advanced Analytics', desc: 'Weekly and monthly charts for weight, calories, and workout volume' },
                  { icon: <Target className="h-5 w-5 text-primary" />, title: 'Personal Records', desc: 'Track your PRs across every exercise and celebrate new milestones' },
                  { icon: <Flame className="h-5 w-5 text-primary" />, title: 'Streak System', desc: 'Build consistency with daily streaks, challenges, and AI motivation' },
                  { icon: <Shield className="h-5 w-5 text-primary" />, title: 'Weekly Reports', desc: 'Detailed weekly breakdowns with actionable improvement tips' },
                ].map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }} className="flex gap-4 items-start group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Dashboard Mock */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <Card className="relative border-border/50 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-border/30">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: `${progressData.length}w`, label: 'Tracked', color: 'text-primary' },
                      { value: '78.0', label: 'Current kg', color: 'text-emerald-400' },
                      { value: '-4.0', label: 'kg Lost', color: 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className={cn('text-2xl sm:text-3xl font-bold', s.color)}>{s.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 sm:p-6 border-b border-border/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Weight Progress</span>
                    <Badge variant="secondary" className="text-[10px]"><TrendingUp className="h-3 w-3 mr-1 text-emerald-400" />On Track</Badge>
                  </div>
                  <div className="relative h-32 w-full">
                    <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                      {[20, 40, 60, 80].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="currentColor" className="text-border/30" strokeWidth="0.5" />)}
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.72 0.19 155)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="oklch(0.72 0.19 155)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d={progressData.map((p, i) => {
                          const x = (i / (progressData.length - 1)) * 300;
                          const y = 100 - ((p.weight - 77) / 6) * 100;
                          return `${i === 0 ? 'M' : 'L'}${x},${Math.max(5, Math.min(95, y))}`;
                        }).join(' ') + ' L300,100 L0,100 Z'}
                        fill="url(#chartGrad)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                      />
                      <motion.path
                        d={progressData.map((p, i) => {
                          const x = (i / (progressData.length - 1)) * 300;
                          const y = 100 - ((p.weight - 77) / 6) * 100;
                          return `${i === 0 ? 'M' : 'L'}${x},${Math.max(5, Math.min(95, y))}`;
                        }).join(' ')}
                        fill="none" stroke="oklch(0.72 0.19 155)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                      {progressData.map((p, i) => {
                        const x = (i / (progressData.length - 1)) * 300;
                        const y = 100 - ((p.weight - 77) / 6) * 100;
                        return <motion.circle key={i} cx={x} cy={Math.max(5, Math.min(95, y))} r="3" fill="oklch(0.72 0.19 155)" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1 + i * 0.08, duration: 0.3 }} />;
                      })}
                    </svg>
                    <div className="absolute left-0 top-0 text-[9px] text-muted-foreground">82kg</div>
                    <div className="absolute left-0 bottom-0 text-[9px] text-muted-foreground">78kg</div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-muted-foreground">W1</span>
                    <span className="text-[9px] text-muted-foreground">W4</span>
                    <span className="text-[9px] text-muted-foreground">W8</span>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Today&apos;s Activity</span>
                    <span className="text-[10px] text-muted-foreground">Dec 15</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Morning Run', stat: '5.2 km · 32 min', icon: <Flame className="h-3.5 w-3.5 text-orange-400" /> },
                      { name: 'Protein Intake', stat: '145g / 160g', icon: <Target className="h-3.5 w-3.5 text-emerald-400" /> },
                      { name: 'Water', stat: '2.1L / 3L', icon: <Activity className="h-3.5 w-3.5 text-sky-400" /> },
                    ].map((a) => (
                      <div key={a.name} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2.5">
                        {a.icon}
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">{a.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{a.stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ BEFORE / AFTER TRANSFORMATIONS ═══════════ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-4"><Award className="h-3 w-3 mr-1" />Transformations</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Real <span className="gradient-text">Results</span>, Real People</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">See what&apos;s possible when you combine dedication with the right tools. These transformations speak for themselves.</p>
          </motion.div>
          <motion.div className="grid md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer}>
            {beforeAfter.map((t) => (
              <motion.div key={t.name} variants={scaleUp}>
                <Card className="h-full border-border/50 overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className={cn('bg-gradient-to-r p-5 text-white relative overflow-hidden', t.gradient)}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">{t.name}</p>
                            <p className="text-sm text-white/80">{t.time} journey</p>
                          </div>
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">{t.result}</Badge>
                        </div>
                      </div>
                    </div>
                    {/* Before / After comparison */}
                    <div className="grid grid-cols-2 divide-x divide-border/50">
                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Before</p>
                        <div className="space-y-2">
                          {Object.entries(t.before).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-sm font-semibold">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-500 mb-3">After</p>
                        <div className="space-y-2">
                          {Object.entries(t.after).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-sm font-bold text-emerald-400">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="px-5 pb-5">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full bg-gradient-to-r', t.gradient)} style={{ width: '100%' }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">Goal achieved ✓</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="text-center mt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Button size="lg" onClick={() => navigate('workouts')} className="gap-2 font-semibold">
              Start Your Transformation <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FAQ SECTION ═══════════ */}
      <section className="py-16 sm:py-24 bg-muted/25">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Frequently Asked <span className="gradient-text">Questions</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to know about Prime Forge. Can&apos;t find the answer? Ask our AI Coach.</p>
          </motion.div>
          <motion.div className="space-y-3" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} custom={0}>
            {faqItems.map((item, i) => (
              <FAQItem key={i} item={item} isOpen={openFAQ === i} onToggle={() => setOpenFAQ(openFAQ === i ? null : i)} />
            ))}
          </motion.div>
          <motion.div className="text-center mt-10" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-sm text-muted-foreground mb-4">Still have questions?</p>
            <Button onClick={() => navigate('ai-coach')} variant="outline" className="gap-2 rounded-xl">
              <Bot className="h-4 w-4" /> Ask AI Coach
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/workout-strength-luxe.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.09_0.01_95_/_0.94),oklch(0.105_0.009_95_/_0.9))]" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to <span className="gradient-text">Transform</span>?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of athletes who are already seeing real results with Prime Forge.
              Your journey starts today — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('workouts')} className="h-14 px-10 text-base rounded-xl neon-glow gap-2 font-semibold">
                Start Training Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('ai-coach')} className="h-14 px-10 text-base rounded-xl gap-2 font-semibold glass border-white/20 text-foreground hover:bg-white/10">
                <Bot className="h-4 w-4" /> Talk to AI Coach
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-16">
              {[
                { value: '500+', label: 'Exercises' },
                { value: '2,500+', label: 'Active Users' },
                { value: '50+', label: 'Foods Tracked' },
                { value: '24/7', label: 'AI Support' },
              ].map((stat) => (
                <motion.div key={stat.label} className="text-center" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
