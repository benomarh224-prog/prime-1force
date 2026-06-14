'use client';

import { CalendarDays, Dumbbell, Home, LayoutDashboard } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
  { label: 'Home', page: 'home', icon: <Home className="h-4 w-4" /> },
  { label: 'Workouts', page: 'workouts', icon: <Dumbbell className="h-4 w-4" /> },
  { label: 'Schedule', page: 'schedule', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
];

export function MobileBottomNav() {
  const { currentPage, navigate } = useAppStore();

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      <div className="mobile-bottom-nav-grid mx-auto grid max-w-md gap-1 rounded-2xl border border-primary/15 bg-background/95 p-1 shadow-[0_-8px_28px_oklch(0_0_0_/_0.34)] ring-1 ring-white/5 backdrop-blur-lg">
        {navItems.map((item) => {
          const active = currentPage === item.page || (currentPage === 'exercise-detail' && item.page === 'workouts');

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className={cn(
                'mobile-bottom-nav-item relative flex min-h-[3.1rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold transition-colors duration-150 min-[380px]:text-[11px]',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_oklch(0.62_0.24_27_/_0.26)]'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
            >
              {item.icon}
              <span className="mobile-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
