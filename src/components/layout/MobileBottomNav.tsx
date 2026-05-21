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
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="mobile-bottom-nav-grid mx-auto grid max-w-md gap-1.5 rounded-2xl border border-primary/15 bg-background/88 p-1.5 shadow-[0_-10px_34px_oklch(0_0_0_/_0.36)] ring-1 ring-white/5 backdrop-blur-2xl">
        {navItems.map((item) => {
          const active = currentPage === item.page || (currentPage === 'exercise-detail' && item.page === 'workouts');

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className={cn(
                'mobile-bottom-nav-item relative flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition-all duration-200 min-[380px]:text-[11px]',
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
