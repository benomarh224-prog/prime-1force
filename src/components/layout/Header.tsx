'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Bell, BookOpen, Bot, Brain, ChevronDown, CircleUserRound, Focus,
  Flame, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Target, Trophy, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { openAuthDialog } from '@/lib/auth-dialog';
import { useAppStore, type PageName } from '@/lib/store';

const mainNav: Array<{label:string;page:PageName}> = [
  {label:'Home',page:'home'}, {label:'Dashboard',page:'dashboard'}, {label:'Growth',page:'growth'},
  {label:'Habits',page:'habits'}, {label:'Learning',page:'learning'}, {label:'AI Coach',page:'ai-coach'},
  {label:'Challenges',page:'challenges'}, {label:'Community',page:'community'}, {label:'Pricing',page:'pricing'},
];

const growthLinks: Array<{label:string;copy:string;page:PageName;icon:typeof Target}> = [
  {label:'Goals',copy:'Turn direction into milestones',page:'goals',icon:Target},
  {label:'Focus Center',copy:'Protect your best attention',page:'focus',icon:Focus},
  {label:'Journal',copy:'Reflect and discover patterns',page:'journal',icon:Brain},
  {label:'Analytics',copy:'Understand your momentum',page:'analytics',icon:BarChart3},
];

export function Header() {
  const { currentPage, navigate } = useAppStore();
  const { data: session, status } = useSession();
  const [scrolled,setScrolled] = useState(false);
  const [growthOpen,setGrowthOpen] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>18);onScroll();window.addEventListener('scroll',onScroll);return()=>window.removeEventListener('scroll',onScroll)},[]);
  const go=(page:PageName)=>{navigate(page);setGrowthOpen(false);setMobileOpen(false)};
  const homeTop=currentPage==='home'&&!scrolled;

  return <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${homeTop?'bg-transparent':'border-b border-white/[.07] bg-[#050816]/85 shadow-[0_12px_40px_rgba(0,0,0,.2)] backdrop-blur-2xl'}`}>
    <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-5 px-4 sm:px-7 lg:px-10">
      <button onClick={()=>go('home')} aria-label="Prime Forge home" className="shrink-0">
        <Image src="/logo-wordmark.png" alt="Prime Forge" width={141} height={24} className="h-6 w-auto" priority/>
      </button>

      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
        {mainNav.map(item=>item.page==='growth'?<div key={item.page} className="relative" onMouseEnter={()=>setGrowthOpen(true)} onMouseLeave={()=>setGrowthOpen(false)}>
          <button onClick={()=>go(item.page)} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition ${['growth','goals','focus','journal','analytics'].includes(currentPage)?'bg-white/[.06] text-white':'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}>Growth<ChevronDown className="h-3 w-3"/></button>
          <AnimatePresence>{growthOpen&&<motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:6,scale:.98}} transition={{duration:.16}} className="absolute left-1/2 top-full w-[430px] -translate-x-1/2 pt-3"><div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[.1] bg-[#080d1f]/95 p-2 shadow-2xl backdrop-blur-2xl">{growthLinks.map(link=>{const Icon=link.icon;return <button key={link.page} onClick={()=>go(link.page)} className="flex gap-3 rounded-xl p-3 text-left transition hover:bg-white/[.05]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-500/[.1] text-sky-300"><Icon className="h-4 w-4"/></span><span><span className="block text-xs font-semibold">{link.label}</span><span className="mt-1 block text-[10px] text-slate-500">{link.copy}</span></span></button>})}</div></motion.div>}</AnimatePresence>
        </div>:<button key={item.page} onClick={()=>go(item.page)} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${currentPage===item.page?'bg-white/[.06] text-white':'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}>{item.label}</button>)}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {status==='authenticated'?<>
          <button onClick={()=>go('settings')} className="hidden h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] text-slate-400 hover:text-white sm:grid"><Bell className="h-4 w-4"/></button>
          <button onClick={()=>go('settings')} className="hidden items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] px-2 py-1.5 text-left sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-semibold">{session?.user?.name?.slice(0,1)||'P'}</span><span className="hidden max-w-24 truncate text-xs font-medium lg:block">{session?.user?.name||'Member'}</span></button>
        </>:<>
          <Button variant="ghost" size="sm" onClick={()=>openAuthDialog('login')} className="hidden rounded-xl text-slate-300 hover:bg-white/[.05] hover:text-white sm:inline-flex">Log in</Button>
          <Button size="sm" onClick={()=>openAuthDialog('signup')} className="hidden rounded-xl bg-blue-600 px-4 text-white shadow-[0_0_24px_rgba(37,99,235,.2)] hover:bg-blue-500 sm:inline-flex">Start free</Button>
        </>}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl border border-white/[.08] bg-white/[.035] text-white xl:hidden"><Menu className="h-5 w-5"/></Button></SheetTrigger>
          <SheetContent side="right" className="w-[min(92vw,380px)] border-white/[.08] bg-[#070b19]/[.98] p-0 text-white backdrop-blur-2xl">
            <SheetTitle className="sr-only">Prime Forge navigation</SheetTitle>
            <div className="border-b border-white/[.07] p-5 pr-12"><Image src="/logo-wordmark.png" alt="Prime Forge" width={141} height={24} className="h-6 w-auto"/><p className="mt-3 text-[10px] uppercase tracking-[.18em] text-sky-300/60">Forge your best self</p></div>
            <div className="grid grid-cols-2 gap-2 p-4">{[
              ['Dashboard',LayoutDashboard,'dashboard'],['Habits',Flame,'habits'],['Goals',Target,'goals'],['Focus',Focus,'focus'],['Journal',Brain,'journal'],['Learning',BookOpen,'learning'],['AI Coach',Bot,'ai-coach'],['Challenges',Trophy,'challenges'],['Community',Users,'community'],['Analytics',BarChart3,'analytics'],['Fitness',Sparkles,'fitness'],['Settings',Settings,'settings']
            ].map(([label,Icon,page])=>{const I=Icon as typeof Target;return <button key={label as string} onClick={()=>go(page as PageName)} className={`rounded-xl border p-3 text-left ${currentPage===page?'border-blue-400/25 bg-blue-500/[.1]':'border-white/[.07] bg-white/[.025]'}`}><I className="h-4 w-4 text-sky-300"/><span className="mt-3 block text-xs font-medium">{label as string}</span></button>})}</div>
            <div className="border-t border-white/[.07] p-4">{status==='authenticated'?<Button onClick={()=>signOut({redirect:false})} variant="outline" className="w-full rounded-xl border-white/[.1] bg-white/[.03] text-white"><LogOut className="h-4 w-4"/>Sign out</Button>:<div className="grid grid-cols-2 gap-2"><Button onClick={()=>openAuthDialog('login')} variant="outline" className="rounded-xl border-white/[.1] bg-white/[.03] text-white">Log in</Button><Button onClick={()=>openAuthDialog('signup')} className="rounded-xl bg-blue-600">Start free</Button></div>}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>;
}
