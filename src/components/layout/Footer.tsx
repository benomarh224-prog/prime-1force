'use client';

import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  const { navigate } = useAppStore();

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-background/70 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate('home')}
              className="block"
              aria-label="Prime Forge home"
            >
              <Image src="/logo-wordmark.png" alt="Prime Forge" width={208} height={32} className="h-7 w-auto" />
            </button>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { label: 'Workouts', page: 'workouts' as const },
              { label: 'Schedule', page: 'schedule' as const },
              { label: 'AI Coach', page: 'ai-coach' as const },
              { label: 'Nutrition', page: 'nutrition' as const },
              { label: 'Contact', page: 'contact' as const },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => navigate('contact')}
            className="flex items-center gap-2 text-xs font-bold text-primary transition-colors hover:text-primary/80"
          >
            Get in touch
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-5 border-t border-white/[0.06] pt-4 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Prime Forge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
