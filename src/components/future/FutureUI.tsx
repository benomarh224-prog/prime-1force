'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

type FutureShellProps = {
  children: ReactNode;
  className?: string;
};

export function FutureShell({ children, className }: FutureShellProps) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.future-orbit', {
        y: -16,
        opacity: 0.78,
        duration: 3.8,
        ease: 'sine.inOut',
        stagger: 0.18,
        repeat: -1,
        yoyo: true,
      });
      gsap.to('.future-scanline', {
        xPercent: 115,
        duration: 6.5,
        ease: 'none',
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={cn('future-shell relative overflow-hidden bg-background text-foreground', className)}>
      <div className="pointer-events-none fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(0,194,255,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,122,26,0.16),transparent_28%),linear-gradient(180deg,#05070b_0%,#080c12_46%,#030407_100%)]" />
        <div className="absolute inset-0 future-grid opacity-[0.22]" />
      </div>
      {children}
    </div>
  );
}

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  intensity?: 'soft' | 'strong';
};

export function GlassPanel({ children, className, intensity = 'soft' }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'future-glass relative overflow-hidden rounded-xl border border-white/[0.12] shadow-[0_24px_70px_rgba(0,0,0,0.36)] backdrop-blur-2xl',
        intensity === 'strong' ? 'bg-white/[0.085]' : 'bg-white/[0.055]',
        className
      )}
    >
      <span className="future-scanline pointer-events-none absolute -left-1/2 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
      {children}
    </div>
  );
}

type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

export function TiltCard({ children, className }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 24, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 180, damping: 24, mass: 0.4 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  return (
    <motion.div
      className={cn('transform-gpu [perspective:900px]', className)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width - 0.5);
        y.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: 'cyan' | 'orange' | 'green';
  icon?: ReactNode;
};

export function MetricCard({ label, value, detail, tone = 'cyan', icon }: MetricCardProps) {
  const toneClass = {
    cyan: 'from-cyan-300/24 via-cyan-300/7 to-transparent text-cyan-200',
    orange: 'from-orange-300/24 via-orange-300/7 to-transparent text-orange-200',
    green: 'from-emerald-300/22 via-emerald-300/7 to-transparent text-emerald-200',
  }[tone];

  return (
    <TiltCard>
      <GlassPanel className="h-full p-4 sm:p-5">
        <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b', toneClass)} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-white sm:text-4xl">{value}</p>
            <p className="mt-2 text-sm text-white/58">{detail}</p>
          </div>
          {icon && (
            <div className="future-icon-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
              {icon}
            </div>
          )}
        </div>
      </GlassPanel>
    </TiltCard>
  );
}

type ProgressRingProps = {
  value: number;
  label: string;
  size?: number;
};

export function ProgressRing({ value, label, size = 132 }: ProgressRingProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const style = {
    '--ring-value': `${safeValue * 3.6}deg`,
    width: size,
    height: size,
  } as CSSProperties;

  return (
    <div className="future-ring grid place-items-center rounded-full" style={style}>
      <div className="grid h-[72%] w-[72%] place-items-center rounded-full border border-white/10 bg-black/54 text-center backdrop-blur-xl">
        <div>
          <p className="text-3xl font-black tabular-nums text-white">{Math.round(safeValue)}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{label}</p>
        </div>
      </div>
    </div>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  copy?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, copy, className }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/70">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-5xl">{title}</h2>
      {copy && <p className="mt-4 text-base leading-8 text-white/58 sm:text-lg">{copy}</p>}
    </div>
  );
}
