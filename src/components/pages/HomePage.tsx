'use client';

import Image from 'next/image';
import { ArrowRight, CalendarDays, Dumbbell, Salad } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName } from '@/lib/store';

const shortcuts: Array<{ icon: typeof Dumbbell; title: string; copy: string; page: PageName }> = [
  { icon: Dumbbell, title: 'Workouts', copy: 'Find your next session.', page: 'workouts' },
  { icon: CalendarDays, title: 'My schedule', copy: 'Plan your training week.', page: 'schedule' },
  { icon: Salad, title: 'Nutrition', copy: 'Support your results.', page: 'nutrition' },
];

export function HomePage() {
  const { navigate } = useAppStore();
  const { status } = useSession();
  const start = () => status === 'authenticated' ? navigate('dashboard') : openAuthDialog('signup');

  return (
    <div className="bg-[#06080c] text-white">
      <section className="relative isolate flex min-h-[650px] items-center overflow-hidden">
        <Image src="/images/hero-primeforge.webp" alt="Athlete training with a dumbbell" fill priority sizes="100vw" className="object-cover object-[65%_center] sm:object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,12,.97)_0%,rgba(6,8,12,.84)_42%,rgba(6,8,12,.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06080c] to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-20 sm:px-8">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-orange-400">Prime Forge</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[.95] tracking-[-.055em] sm:text-7xl">Train. Track. Get stronger.</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">Your simple place for workouts, training plans, and nutrition.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={start} size="lg" className="h-12 rounded-xl bg-orange-500 px-6 font-semibold hover:bg-orange-400">Start now <ArrowRight className="h-4 w-4" /></Button>
              <Button onClick={() => navigate('workouts')} size="lg" variant="outline" className="h-12 rounded-xl border-white/20 bg-black/20 px-6 text-white hover:bg-white/10 hover:text-white">View workouts</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <button key={shortcut.title} onClick={() => navigate(shortcut.page)} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-5 text-left transition hover:border-orange-400/35 hover:bg-white/[.06]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-lg font-semibold">{shortcut.title}</span><span className="mt-1 block text-sm text-slate-400">{shortcut.copy}</span></span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-orange-400" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
