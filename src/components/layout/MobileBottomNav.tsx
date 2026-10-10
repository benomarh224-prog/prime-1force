'use client';

import { Dumbbell, Home, Layers, Activity } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';

const items: Array<{ label: string; page: PageName; icon: typeof Home }> = [
  { label: 'Forge', page: 'home', icon: Home },
  { label: 'Train', page: 'workouts', icon: Dumbbell },
  { label: 'Programs', page: 'programs', icon: Layers },
  { label: 'Progress', page: 'dashboard', icon: Activity },
];
export function MobileBottomNav() {
  const { currentPage, navigate } = useAppStore();
  return <nav className="forge-bottom-nav" aria-label="Quick navigation">{items.map(item => { const Icon = item.icon; const active = currentPage === item.page || (item.page === 'programs' && currentPage === 'schedule'); return <button key={item.page} onClick={() => navigate(item.page)} aria-current={active ? 'page' : undefined}><Icon size={19} /><span>{item.label}</span></button>; })}</nav>;
}
