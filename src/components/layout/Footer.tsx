'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useAppStore, type PageName } from '@/lib/store';

const columns: Array<{title:string;links:Array<[string,PageName]>}> = [
  {title:'Product',links:[['Dashboard','dashboard'],['Habits','habits'],['Goals','goals'],['Focus','focus'],['AI Coach','ai-coach']]},
  {title:'Explore',links:[['Learning','learning'],['Challenges','challenges'],['Community','community'],['Fitness','fitness'],['Analytics','analytics']]},
  {title:'Company',links:[['About','about'],['Blog','blog'],['Pricing','pricing'],['Contact','contact']]},
];

export function Footer(){
  const navigate=useAppStore(s=>s.navigate);
  return <footer className="border-t border-white/[.07] bg-[#040611] text-white">
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18">
      <div className="grid gap-10 sm:gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div><button onClick={()=>navigate('home')}><Image src="/logo-wordmark.png" alt="Prime Forge" width={176} height={30} className="h-7 w-auto"/></button><p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">Forge your best self with one intelligent system for discipline, focus, learning, mindset, health, and meaningful growth.</p><button onClick={()=>navigate('dashboard')} className="mt-6 flex items-center gap-2 text-sm font-medium text-sky-300">Start your journey <ArrowUpRight className="h-4 w-4"/></button></div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">{columns.map((column,index)=><div key={column.title} className={index===2?'col-span-2 sm:col-span-1':''}><p className="text-xs font-semibold text-slate-300">{column.title}</p><div className="mt-4 space-y-3">{column.links.map(([label,page])=><button key={page} onClick={()=>navigate(page)} className="block text-xs text-slate-500 transition hover:text-white">{label}</button>)}</div></div>)}</div>
      </div>
      <div className="mt-14 flex flex-col gap-3 border-t border-white/[.06] pt-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Prime Forge. Forge Your Best Self.</p><p>Built for intentional humans.</p></div>
    </div>
  </footer>;
}
