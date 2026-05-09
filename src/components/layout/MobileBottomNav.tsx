'use client';

import { CalendarDays, Dumbbell, Home, LayoutDashboard } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
  { label: 'Home', page: 'home', icon: <Home className="h-5 w-5" /> },
  { label: 'Workouts', page: 'workouts', icon: <Dumbbell className="h-5 w-5" /> },
  { label: 'Schedule', page: 'schedule', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
];

export function MobileBottomNav() {
  const { currentPage, navigate } = useAppStore();

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-primary/15 bg-background/90 px-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_42px_oklch(0_0_0_/_0.34)] backdrop-blur-xl lg:hidden">
      <div className="mobile-bottom-nav-grid mx-auto grid max-w-md gap-1">
        {navItems.map((item) => {
          const active = currentPage === item.page || (currentPage === 'exercise-detail' && item.page === 'workouts');

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className={cn(
                'mobile-bottom-nav-item flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors min-[380px]:text-[11px]',
                active
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
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
