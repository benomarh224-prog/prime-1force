'use client';

import { Bot, CheckCircle2, Focus, Home, LayoutDashboard } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';

const items: Array<{label:string;page:PageName;icon:typeof Home}> = [
  {label:'Home',page:'home',icon:Home},
  {label:'Today',page:'dashboard',icon:LayoutDashboard},
  {label:'Habits',page:'habits',icon:CheckCircle2},
  {label:'Focus',page:'focus',icon:Focus},
  {label:'Coach',page:'ai-coach',icon:Bot},
];

export function MobileBottomNav() {
  const {currentPage,navigate}=useAppStore();
  return <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(.55rem,env(safe-area-inset-bottom))] lg:hidden">
    <div className="mobile-bottom-nav-grid mx-auto grid max-w-md grid-cols-5 rounded-2xl border border-white/[.1] bg-[#070b19]/95 p-1.5 shadow-[0_-16px_50px_rgba(0,0,0,.4)] backdrop-blur-2xl">
      {items.map(item=>{const Icon=item.icon;const active=currentPage===item.page;return <button key={item.page} onClick={()=>navigate(item.page)} className={`mobile-bottom-nav-item flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-medium transition ${active?'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.22)]':'text-slate-500'}`}><Icon className="h-4 w-4"/><span className="mobile-bottom-nav-label truncate">{item.label}</span></button>})}
    </div>
  </nav>;
}
