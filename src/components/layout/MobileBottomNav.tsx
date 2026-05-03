'use client';

import { Bot, Dumbbell, Home, LayoutDashboard } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
  { label: 'Home', page: 'home', icon: <Home className="h-5 w-5" /> },
  { label: 'Workouts', page: 'workouts', icon: <Dumbbell className="h-5 w-5" /> },
  { label: 'Coach', page: 'ai-coach', icon: <Bot className="h-5 w-5" /> },
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
];

export function MobileBottomNav() {
  const { currentPage, navigate } = useAppStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/15 bg-background/92 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_42px_oklch(0_0_0_/_0.38)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {navItems.map((item) => {
          const active = currentPage === item.page || (currentPage === 'exercise-detail' && item.page === 'workouts');

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-colors',
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
