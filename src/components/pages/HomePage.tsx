'use client';

import Image from 'next/image';
import { ArrowRight, CalendarDays, Dumbbell, Salad } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName } from '@/lib/store';

const links: Array<{ icon: typeof Dumbbell; title: string; page: PageName }> = [
  { icon: Dumbbell, title: 'Workouts', page: 'workouts' },
  { icon: CalendarDays, title: 'Schedule', page: 'schedule' },
  { icon: Salad, title: 'Nutrition', page: 'nutrition' },
];

export function HomePage() {
  const { navigate } = useAppStore();
  const { status } = useSession();
  const start = () => status === 'authenticated' ? navigate('dashboard') : openAuthDialog('signup');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#07090d] text-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 sm:py-32 lg:min-h-[680px] lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-orange-400">PRIME FORGE</p>
          <h1 className="mt-5 text-balance text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl">Train better.<br />Feel stronger.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">Simple workouts and plans to help you stay consistent.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={start} size="lg" className="h-12 rounded-lg bg-orange-500 px-6 font-semibold hover:bg-orange-400">Start training <ArrowRight className="h-4 w-4" /></Button>
            <Button onClick={() => navigate('workouts')} variant="ghost" size="lg" className="h-12 rounded-lg px-5 text-slate-300 hover:bg-white/[.06] hover:text-white">See workouts</Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[#101217] shadow-2xl">
          <div className="relative aspect-[4/3]"><Image src="/images/hero-primeforge.webp" alt="Athlete training with a dumbbell" fill priority sizes="(max-width: 1024px) 100vw, 560px" className="object-cover object-[65%_center]" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" /></div>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6"><p className="text-xs font-medium uppercase tracking-[.14em] text-orange-300">Start today</p><p className="mt-1 text-xl font-semibold">One workout at a time.</p></div>
        </div>
      </section>

      <section className="border-t border-white/[.08]">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid divide-y divide-white/[.08] border-y border-white/[.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {links.map((link) => {
              const Icon = link.icon;
              return <button key={link.title} onClick={() => navigate(link.page)} className="flex items-center gap-3 px-1 py-5 text-left transition hover:text-orange-300 sm:px-6 sm:py-4"><Icon className="h-5 w-5 text-orange-400" /><span className="font-medium">{link.title}</span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></button>;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
