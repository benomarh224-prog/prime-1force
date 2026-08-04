'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, BarChart3, Bell, BookOpen, Brain, Calendar, Check, ChevronRight,
  CircleUserRound, Clock3, Coffee, Dumbbell, Flame, Focus, GraduationCap, Heart, HeartPulse,
  Library, Lock, MessageCircle, MoreHorizontal, Pause, Play, Plus, Search, Settings,
  Share2, Sparkles, Target, TimerReset, Trophy, Users, Volume2, Zap
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { useGrowthStore, type HabitCategory } from '@/lib/growth-store';
import { useAppStore, type PageName } from '@/lib/store';

const pageMeta: Record<string, [string, string, string]> = {
  growth: ['Growth OS', 'Build every dimension of your life.', 'One connected system for discipline, mindset, health, knowledge, and meaningful progress.'],
  habits: ['Habit systems', 'Consistency becomes identity.', 'Build routines that survive imperfect days and compound into lasting change.'],
  goals: ['Goals & direction', 'Turn ambition into motion.', 'Connect your long-term vision to milestones and the next concrete action.'],
  focus: ['Focus center', 'Give your best attention to what matters.', 'Enter distraction-free sessions and protect your best energy.'],
  journal: ['Journal', 'Think clearly. Live intentionally.', 'Reflect, track your mood, practice gratitude, and discover patterns.'],
  learning: ['Learning hub', 'Make knowledge compound.', 'Build roadmaps, reading systems, and a library aligned with your goals.'],
  challenges: ['Challenges', 'Prove it to yourself.', 'Focused protocols that turn intention into evidence.'],
  community: ['Community', 'Grow alongside people who get it.', 'Share progress, learn from others, and join meaningful challenges.'],
  analytics: ['Personal analytics', 'See the patterns shaping your life.', 'Understand momentum across habits, focus, learning, mood, and health.'],
  fitness: ['Fitness', 'Build a body that supports your ambition.', 'Training, nutrition, and recovery—connected to your whole life.'],
  pricing: ['Simple pricing', 'Invest in the system behind your future.', 'Start free and upgrade when you want deeper intelligence.'],
  about: ['Our mission', 'Human potential deserves better tools.', 'Prime Forge turns self-improvement into a clear, sustainable practice.'],
  blog: ['Prime Forge journal', 'Ideas for a more intentional life.', 'Evidence-based thinking on habits, focus, mindset, learning, and health.'],
  settings: ['Settings', 'Make Prime Forge yours.', 'Tune your profile, privacy, notifications, and coaching preferences.'],
};

const areas: Array<[string, typeof Target, number, string, PageName, string]> = [
  ['Discipline', Flame, 84, '16 day momentum', 'habits', 'text-orange-300'],
  ['Focus', Focus, 78, '5.3 hours this week', 'focus', 'text-sky-300'],
  ['Mindset', Brain, 72, '4 reflections this week', 'journal', 'text-violet-300'],
  ['Learning', GraduationCap, 67, '3 active roadmaps', 'learning', 'text-indigo-300'],
  ['Health', HeartPulse, 81, 'Strong recovery trend', 'fitness', 'text-emerald-300'],
  ['Purpose', Target, 76, '3 active goals', 'goals', 'text-blue-300'],
];

const chartData = [
  { day:'M', growth:62, habits:70 }, { day:'T', growth:68, habits:76 },
  { day:'W', growth:64, habits:72 }, { day:'T', growth:75, habits:82 },
  { day:'F', growth:79, habits:86 }, { day:'S', growth:86, habits:94 },
  { day:'S', growth:83, habits:91 },
];

function PageShell({ children }: { children: React.ReactNode }) {
  const current = useAppStore((s) => s.currentPage);
  const [eyebrow, title, copy] = pageMeta[current] || pageMeta.growth;
  return <div className="min-h-screen bg-[#050816] pb-28 pt-24 text-white lg:pb-16">
    <div className="pf-grid pointer-events-none fixed inset-0 opacity-[.12]" />
    <div className="relative mx-auto max-w-[1400px] px-4 sm:px-7 lg:px-10">
      <motion.header initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} className="mb-9 max-w-4xl">
        <p className="pf-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-.045em] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">{copy}</p>
      </motion.header>
      {children}
    </div>
  </div>;
}

function Overview() {
  const navigate = useAppStore((s) => s.navigate);
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{areas.map(([title,Icon,score,detail,page,color],i) =>
    <motion.button initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.05}} key={title} onClick={()=>navigate(page)} className="pf-card group p-6 text-left">
      <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl border border-white/[.08] bg-white/[.035] ${color}`}><Icon className="h-5 w-5"/></span><span className="text-3xl font-semibold">{score}<small className="text-xs text-slate-600">/100</small></span></div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-500">{detail}</p>
      <div className="mt-5 h-1 rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" style={{width:`${score}%`}}/></div>
      <span className="mt-5 flex items-center gap-2 text-xs text-sky-300">Open module <ArrowRight className="h-3.5 w-3.5"/></span>
    </motion.button>
  )}</div>;
}

function Habits() {
  const { habits, toggleHabit, addHabit } = useGrowthStore();
  const [adding,setAdding] = useState(false);
  const [title,setTitle] = useState('');
  const [category,setCategory] = useState<HabitCategory>('Discipline');
  const submit=()=>{if(title.trim()){addHabit(title.trim(),category);setTitle('');setAdding(false);}};
  return <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
    <div className="pf-card p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="font-semibold">Today&apos;s habits</p><p className="mt-1 text-xs text-slate-500">{habits.filter(h=>h.completed).length} of {habits.length} completed</p></div><Button onClick={()=>setAdding(!adding)} size="sm" className="rounded-xl bg-blue-600"><Plus className="h-4 w-4"/>New habit</Button></div>
      {adding&&<div className="mt-5 grid gap-3 rounded-2xl border border-blue-300/15 bg-blue-500/[.06] p-4 sm:grid-cols-[1fr_auto_auto]"><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="What do you want to repeat?" className="h-10 rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm outline-none"/><select value={category} onChange={e=>setCategory(e.target.value as HabitCategory)} className="h-10 rounded-xl border border-white/[.1] bg-[#0a1025] px-3 text-sm">{['Discipline','Mindset','Health','Learning'].map(x=><option key={x}>{x}</option>)}</select><Button onClick={submit} className="rounded-xl bg-blue-600">Add</Button></div>}
      <div className="mt-5 space-y-3">{habits.map(h=><button key={h.id} onClick={()=>toggleHabit(h.id)} className="flex w-full items-center gap-4 rounded-2xl border border-white/[.075] bg-white/[.022] p-4 text-left transition hover:border-blue-400/20">
        <span className={`grid h-8 w-8 place-items-center rounded-xl border ${h.completed?'border-blue-500 bg-blue-600':'border-white/[.14]'}`}>{h.completed&&<Check className="h-4 w-4"/>}</span><span className="h-9 w-1 rounded-full" style={{background:h.color}}/><div className="min-w-0 flex-1"><p className={h.completed?'text-slate-500 line-through':'font-medium'}>{h.title}</p><p className="mt-1 text-xs text-slate-500">{h.category} · Daily</p></div><span className="flex items-center gap-1 text-xs text-orange-300"><Flame className="h-3.5 w-3.5"/>{h.streak}</span>
      </button>)}</div>
    </div>
    <div className="space-y-4"><div className="pf-card p-6 text-center"><div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#38bdf8_0_72%,rgba(255,255,255,.06)_72%)]"><div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-[#080d1f]"><div><p className="text-3xl font-semibold">72%</p><p className="text-[10px] text-slate-500">this month</p></div></div></div><p className="mt-5 font-semibold">Strong consistency</p><p className="mt-2 text-xs text-slate-500">8% ahead of last month.</p></div><div className="pf-card p-5"><p className="text-sm font-semibold">Best streaks</p><div className="mt-4 space-y-3">{[...habits].sort((a,b)=>b.streak-a.streak).slice(0,3).map((h,i)=><div key={h.id} className="flex gap-3 text-xs"><span className="text-slate-600">0{i+1}</span><span className="flex-1 text-slate-300">{h.title}</span><span className="text-orange-300">{h.streak}d</span></div>)}</div></div></div>
  </div>;
}

function Goals() {
  const { goals,updateGoal }=useGrowthStore();
  return <div className="grid gap-4 lg:grid-cols-3">{goals.map(goal=><div key={goal.id} className="pf-card p-6">
    <div className="flex justify-between"><span className="rounded-full bg-blue-400/[.08] px-2.5 py-1 text-[10px] text-sky-300">{goal.area}</span><MoreHorizontal className="h-4 w-4 text-slate-600"/></div>
    <h2 className="mt-8 min-h-14 text-xl font-semibold">{goal.title}</h2><div className="mt-6 flex items-end justify-between"><span className="text-4xl font-semibold">{goal.progress}<small className="text-lg text-slate-500">%</small></span><span className="text-xs text-slate-500">Due {goal.deadline}</span></div>
    <input aria-label={goal.title} type="range" min="0" max="100" value={goal.progress} onChange={e=>updateGoal(goal.id,Number(e.target.value))} className="mt-5 w-full accent-blue-500"/>
    <div className="mt-6 space-y-3 border-t border-white/[.07] pt-5">{['Define milestone','Complete next action','Review progress'].map((x,i)=><div key={x} className="flex items-center gap-3 text-sm"><span className={`grid h-5 w-5 place-items-center rounded-md border ${i===0?'border-blue-500 bg-blue-600':'border-white/[.12]'}`}>{i===0&&<Check className="h-3 w-3"/>}</span><span className={i===0?'text-slate-500 line-through':'text-slate-300'}>{x}</span></div>)}</div>
  </div>)}<button className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/[.12] text-slate-500 hover:text-sky-300"><span><Plus className="mx-auto h-6 w-6"/><span className="mt-3 block text-sm">Create a new goal</span></span></button></div>;
}

function FocusCenter() {
  const addFocusMinutes=useGrowthStore(s=>s.addFocusMinutes);
  const [seconds,setSeconds]=useState(25*60); const [running,setRunning]=useState(false); const [sound,setSound]=useState('Rain');
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(v=>{if(v<=1){setRunning(false);addFocusMinutes(25);return 25*60}return v-1}),1000);return()=>clearInterval(id)},[running,addFocusMinutes]);
  const clock=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  return <div className="grid gap-4 lg:grid-cols-[1fr_340px]"><div className="pf-panel relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-14"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(37,99,235,.2),transparent_36%)]"/><div className="relative"><span className="rounded-full bg-sky-400/[.07] px-3 py-1 text-xs text-sky-300">Deep work session</span><p className="mt-12 font-mono text-[clamp(4.5rem,14vw,9rem)] font-medium leading-none tracking-[-.08em]">{clock}</p><p className="mt-5 text-sm text-slate-500">Working on · Digital product launch</p><div className="mt-10 flex justify-center gap-3"><button onClick={()=>setRunning(!running)} className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,.35)]">{running?<Pause className="h-6 w-6"/>:<Play className="h-6 w-6 fill-current"/>}</button><button onClick={()=>{setRunning(false);setSeconds(1500)}} className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[.1] bg-white/[.04]"><TimerReset className="h-5 w-5"/></button></div><div className="mx-auto mt-10 flex max-w-sm gap-2">{[25,50,90].map(v=><button key={v} onClick={()=>{setRunning(false);setSeconds(v*60)}} className="flex-1 rounded-xl border border-white/[.08] py-2 text-xs text-slate-400">{v} min</button>)}</div></div></div>
    <div className="space-y-4"><div className="pf-card p-5"><p className="text-sm font-semibold">Ambient sound</p><div className="mt-4 grid grid-cols-2 gap-2">{['Rain','Forest','Cafe','Brown noise'].map(x=><button key={x} onClick={()=>setSound(x)} className={`rounded-xl border p-3 text-left text-xs ${sound===x?'border-blue-400/30 bg-blue-500/[.1] text-sky-300':'border-white/[.07] text-slate-500'}`}><Volume2 className="mb-3 h-4 w-4"/>{x}</button>)}</div></div><div className="pf-card p-5"><p className="text-sm font-semibold">Today&apos;s focus</p><div className="mt-5 flex items-end gap-2">{[38,65,48,82,58,72,44].map((h,i)=><div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-sky-400/80" style={{height:h}}/>)}</div></div><div className="pf-card flex items-center gap-3 p-4"><Lock className="h-4 w-4 text-sky-300"/><div><p className="text-sm">Website blocker</p><p className="text-[10px] text-slate-500">Browser extension coming soon</p></div></div></div>
  </div>;
}

function Journal() {
  const add=useGrowthStore(s=>s.addJournalEntry); const [entry,setEntry]=useState(''); const [saved,setSaved]=useState(false);
  const save=()=>{if(!entry.trim())return;add();setSaved(true);setEntry('');setTimeout(()=>setSaved(false),1500)};
  return <div className="grid gap-4 lg:grid-cols-[1fr_330px]"><div className="pf-card p-5 sm:p-7"><div className="flex justify-between"><div><p className="font-semibold">Today&apos;s reflection</p><p className="mt-1 text-xs text-slate-500">August 4, 2026 · Private</p></div><span className="text-[10px] text-slate-500">Auto-saved</span></div><div className="mt-6 rounded-2xl bg-blue-400/[.045] p-4"><p className="text-[10px] uppercase tracking-wider text-sky-300">Reflection prompt</p><p className="mt-2 text-sm">What did you do today that your future self will thank you for?</p></div><textarea value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Write without judgment…" className="mt-5 min-h-72 w-full resize-none rounded-2xl border border-white/[.08] bg-black/20 p-5 text-sm leading-7 outline-none"/><div className="mt-4 flex justify-between"><div className="flex gap-2">{['😞','😐','🙂','😊','🔥'].map(x=><button key={x} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.07]">{x}</button>)}</div><Button onClick={save} className="rounded-xl bg-blue-600">{saved?'Saved':'Save entry'}</Button></div></div><div className="space-y-4"><div className="pf-card p-5"><p className="text-sm font-semibold">Gratitude</p><div className="mt-4 space-y-3">{['A focused morning','A supportive conversation','Energy to train'].map(x=><div key={x} className="flex gap-3 rounded-xl bg-white/[.025] p-3 text-xs text-slate-400"><Heart className="h-3.5 w-3.5 text-rose-300"/>{x}</div>)}</div></div><div className="pf-card p-5"><div className="flex justify-between"><p className="text-sm font-semibold">Recent entries</p><Search className="h-4 w-4 text-slate-600"/></div>{['A lesson in patience','What real progress feels like','Monthly intentions'].map(x=><button key={x} className="mt-4 block text-left text-sm text-slate-400">{x}</button>)}</div><button className="pf-card flex w-full gap-3 p-4 text-left"><Sparkles className="h-4 w-4 text-sky-300"/><span className="text-sm">Generate AI summary</span></button></div></div>;
}

const modules: Record<string, Array<[string,string,string]>> = {
  learning: [['Atomic Habits','Book · James Clear','62% complete'],['The Science of Well-Being','Course · Yale University','38% complete'],['Build a digital business','12-week roadmap','47% complete'],['Deep Work','Recommended next','Save to library']],
  challenges: [['30-Day Discipline','12,840 people joined','12 / 30 days'],['Read Every Day','8,192 people joined','8 / 30 days'],['No Social Media','5,607 people joined','3 / 7 days'],['Cold Shower Reset','3,921 people joined','Join challenge']],
  blog: [['Why your environment beats motivation','Discipline','8 min read'],['The anatomy of a productive week','Focus','11 min read'],['Confidence is evidence','Mindset','6 min read'],['Remember what you read','Learning','9 min read'],['Energy is the real productivity system','Health','7 min read'],['Choose a goal worth suffering for','Goals','10 min read']],
};

function CardGrid({type}:{type:'learning'|'challenges'|'blog'}) {
  const Icon=type==='learning'?BookOpen:type==='challenges'?Trophy:Library;
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules[type].map(([title,copy,meta],i)=><div key={title} className="pf-card p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/[.1] text-sky-300"><Icon className="h-5 w-5"/></span><p className="mt-6 text-xs text-sky-300">{type==='blog'?copy:meta}</p><h2 className="mt-2 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm text-slate-500">{type==='blog'?meta:copy}</p><Button variant="outline" className="mt-6 w-full rounded-xl border-white/[.09] bg-white/[.025] text-white">{type==='challenges'?'View challenge':'Continue'}<ArrowRight className="h-4 w-4"/></Button></div>)}</div>;
}

function Community() {
  const posts=[['Maya Chen','Day 30 of my discipline challenge. The biggest lesson: make the right action easier, not the motivation stronger.','284'],['Adam Walker','I just crossed 100 hours of deep work. Building this capacity changed everything I create.','192'],['Sara Benali','Finished my first 12-book roadmap. Sharing my notes on confidence through evidence.','347']];
  return <div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="space-y-4">{posts.map(([name,text,likes])=><article key={name} className="pf-card p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-xs">{name.split(' ').map(x=>x[0]).join('')}</span><div><p className="text-sm font-semibold">{name}</p><p className="text-[10px] text-slate-500">Level 18 · 2h</p></div></div><p className="mt-5 text-sm leading-7 text-slate-300">{text}</p><div className="mt-5 flex gap-5 border-t border-white/[.06] pt-4 text-xs text-slate-500"><Heart className="h-4 w-4"/>{likes}<MessageCircle className="h-4 w-4"/>Reply<Share2 className="ml-auto h-4 w-4"/></div></article>)}</div><div className="pf-card h-fit p-5"><p className="font-semibold">Weekly leaderboard</p>{[['1','Lena R.','1,840'],['2','Karim B.','1,720'],['3','You','1,485'],['4','Jonas M.','1,390']].map(x=><div key={x[0]} className="mt-4 flex items-center gap-3 text-xs"><span className="text-slate-500">{x[0]}</span><span className="flex-1">{x[1]}</span><span className="text-sky-300">{x[2]} XP</span></div>)}</div></div>;
}

function Analytics() {
  return <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Growth score','83','+8%'],['Habit completion','91%','+6%'],['Focus hours','5.3h','+42m'],['Average mood','4.2','+0.3']].map(x=><div key={x[0]} className="pf-card p-5"><p className="text-xs text-slate-500">{x[0]}</p><p className="mt-3 text-3xl font-semibold">{x[1]}</p><p className="mt-2 text-xs text-emerald-400">{x[2]} this week</p></div>)}</div><div className="pf-card mt-4 p-6"><p className="font-semibold">Growth trajectory</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" stopOpacity=".28"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false}/><XAxis dataKey="day" tick={{fill:'#64748b',fontSize:11}} axisLine={false}/><YAxis hide/><Tooltip contentStyle={{background:'#090f24',border:'1px solid rgba(255,255,255,.1)',borderRadius:12}}/><Area type="monotone" dataKey="growth" stroke="#38bdf8" strokeWidth={2.5} fill="url(#gf)"/></AreaChart></ResponsiveContainer></div></div></>;
}

function Fitness() {
  const navigate=useAppStore(s=>s.navigate);
  const items:Array<[string,string,typeof Dumbbell,PageName,string]>=[['Workouts','Programs, sessions, exercise library, and progressive overload.',Dumbbell,'workouts','4 this week'],['Nutrition','Calories, macros, meal intelligence, and guidance.',Coffee,'nutrition','2,240 kcal'],['Schedule','Plan training around real life and recovery.',Calendar,'schedule','Next: Upper'],['Body & recovery','Measurements, sleep, energy, and readiness.',Activity,'dashboard','81 readiness']];
  return <div className="grid gap-4 md:grid-cols-2">{items.map(([title,copy,Icon,page,stat])=><button key={title} onClick={()=>navigate(page)} className="pf-card p-6 text-left"><div className="flex justify-between"><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-400/[.07] text-emerald-300"><Icon className="h-5 w-5"/></span><span className="text-xs text-slate-500">{stat}</span></div><h2 className="mt-7 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p><span className="mt-6 flex gap-2 text-xs text-sky-300">Open <ArrowRight className="h-3.5 w-3.5"/></span></button>)}</div>;
}

function Pricing() {
  const plans=[['Starter','Free','Habits and goals|Focus timer|Basic journal|Fitness tracking'],['Pro','$12/mo','Everything in Starter|Unlimited AI coaching|Advanced analytics|AI journal insights'],['Lifetime','$249','Everything in Pro|Lifetime access|Founder badge|Priority features']];
  return <div className="grid gap-4 lg:grid-cols-3">{plans.map((x,i)=><div key={x[0]} className={`rounded-2xl border p-6 ${i===1?'border-blue-400/40 bg-blue-500/[.09]':'border-white/[.08] bg-white/[.025]'}`}><p className="font-semibold">{x[0]}</p><p className="mt-6 text-4xl font-semibold">{x[1]}</p><div className="my-7 h-px bg-white/[.07]"/>{x[2].split('|').map(f=><p key={f} className="mt-3 flex gap-2 text-sm text-slate-300"><Check className="h-4 w-4 text-sky-300"/>{f}</p>)}<Button className="mt-8 w-full rounded-xl bg-blue-600">Get started</Button></div>)}</div>;
}

function Simple({type}:{type:'about'|'settings'}) {
  if(type==='settings')return <div className="pf-card p-6"><p className="font-semibold">Profile & preferences</p><div className="mt-6 grid gap-5 sm:grid-cols-2">{[['Display name','Houssam'],['Primary focus','Build discipline'],['Week starts','Monday'],['Timezone','Europe / Paris']].map(x=><label key={x[0]} className="text-xs text-slate-500">{x[0]}<input defaultValue={x[1]} className="mt-2 h-11 w-full rounded-xl border border-white/[.09] bg-black/20 px-3 text-sm text-white"/></label>)}</div><Button className="mt-8 rounded-xl bg-blue-600">Save changes</Button></div>;
  return <div className="grid gap-4 md:grid-cols-3">{[['Clarity over noise','Growth should make life simpler, not become another source of pressure.'],['Systems over motivation','We design for days when inspiration disappears and identity carries you.'],['The whole person','Ambition, health, learning, and inner life belong in one honest picture.']].map((x,i)=><div key={x[0]} className="pf-card p-6"><span className="text-4xl text-blue-500/60">0{i+1}</span><h2 className="mt-6 text-xl font-semibold">{x[0]}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{x[1]}</p></div>)}</div>;
}

export function GrowthPage() {
  const page=useAppStore(s=>s.currentPage);
  let content:React.ReactNode=<Overview/>;
  if(page==='habits')content=<Habits/>; else if(page==='goals')content=<Goals/>; else if(page==='focus')content=<FocusCenter/>; else if(page==='journal')content=<Journal/>; else if(page==='learning'||page==='challenges'||page==='blog')content=<CardGrid type={page}/>;
  else if(page==='community')content=<Community/>; else if(page==='analytics')content=<Analytics/>; else if(page==='fitness')content=<Fitness/>; else if(page==='pricing')content=<Pricing/>; else if(page==='about'||page==='settings')content=<Simple type={page}/>;
  return <PageShell>{content}</PageShell>;
}
