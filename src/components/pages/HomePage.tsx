'use client';

import Image from 'next/image';
import { ArrowRight, BarChart3, Bot, Clock3, Dumbbell, Flame, MessageCircle, Target, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLabStore } from '@/lib/lab-store';
import { trainingSplits, type SplitId } from '@/lib/splits';
import { getTrainingWeek, mergeCompletedLogs } from '@/lib/training-overview';
import { TodayWorkout } from '@/components/forge/TodayWorkout';
import { WeeklyTraining } from '@/components/forge/WeeklyTraining';

export function HomePage() {
  const navigate = useAppStore(state => state.navigate);
  const weeklyGoal = useAppStore(state => state.weeklyGoal);
  const workoutLogs = useAppStore(state => state.workoutLogs);
  const history = useLabStore(state => state.history);
  const selectSplit = useLabStore(state => state.selectSplit);
  const logs = mergeCompletedLogs(workoutLogs, history);
  const thisWeek = getTrainingWeek(logs).sessions;
  const totalSets = logs.reduce((sum, log) => sum + log.exercises.reduce((count, exercise) => count + exercise.sets.length, 0), 0);
  const minutes = logs.reduce((sum, log) => sum + log.duration, 0);
  const goal = Math.max(1, weeklyGoal);
  const openSplit = (id: SplitId) => { selectSplit(id); navigate('programs'); };

  return <div className="ref-home">
    <section className="ref-hero">
      <Image unoptimized loading="eager" src="/images/primeforge-hero-ref.webp" alt="Athlete preparing for a training session in an orange-lit gym" fill priority sizes="100vw" className="ref-hero-image" />
      <div className="ref-hero-shade" />
      <div className="ref-container ref-hero-inner">
        <div className="ref-hero-copy">
          <h1>BUILD YOUR BODY.<br /><span>FORGE YOUR MIND.</span></h1>
          <p>Train with purpose. Track your progress.<br />Become stronger every day.</p>
          <div className="ref-hero-actions"><button className="ref-button" onClick={() => navigate('workouts')}>Start Your Journey <ArrowRight size={19} /></button><button className="ref-button ref-button-outline" onClick={() => navigate('programs')}>Explore Programs</button></div>
          <div className="ref-hero-features"><button onClick={() => navigate('workouts')}><Dumbbell size={20} />Track Workouts</button><button onClick={() => navigate('dashboard')}><BarChart3 size={20} />See Progress</button><span><Flame size={19} />Build Discipline</span></div>
        </div>
        <button className="ref-weekly" onClick={() => navigate('dashboard')} aria-label={'View progress: ' + thisWeek + ' of ' + goal + ' weekly sessions'}><span>Weekly progress <strong>{thisWeek} <small>/ {goal} workouts</small></strong></span><div className="ref-weekly-track"><i style={{ width: Math.min(100, thisWeek / goal * 100) + '%' }} /></div></button>
      </div>
    </section>
    <div className="ref-container ref-lower">
      <div className="home-training-overview"><TodayWorkout logs={logs} /><WeeklyTraining logs={logs} goal={goal} /></div>
      <section className="ref-split-grid" aria-label="Explore training splits">{trainingSplits.map(split => <button key={split.id} className="ref-split-card" onClick={() => openSplit(split.id)}>
        <Image unoptimized loading="eager" src={split.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
        <div className="ref-split-shade" /><div className="ref-split-copy"><h2>{split.label}</h2><p>{split.muscles}</p><div className="ref-split-meta"><span><BarChart3 size={15} />{split.movements.length} exercises</span><span><Clock3 size={15} />3 sets each</span></div></div><span className="ref-card-arrow"><ArrowRight size={18} /></span>
      </button>)}</section>
      <section className="ref-coach-banner">
        <Image unoptimized loading="eager" src="/images/primeforge-coach-ref.webp" alt="" fill sizes="(max-width: 700px) 100vw, 1120px" />
        <div className="ref-coach-shade" /><div className="ref-coach-copy"><p className="ref-kicker">PRIME FORGE</p><h2>YOUR PERSONAL AI COACH</h2><p>Smarter training. Built around you.</p><button className="ref-button" onClick={() => navigate('ai-coach')}>Meet Your Coach <ArrowRight size={17} /></button></div>
        <ul className="ref-coach-features"><li><Bot size={15} />Training ideas</li><li><Target size={15} />Practical guidance</li><li><TrendingUp size={15} />Workout questions</li><li><MessageCircle size={15} />A conversation, not a checklist</li></ul>
      </section>
      <section className="ref-stats" aria-label="Your recorded training">{[[Dumbbell, logs.length, 'Sessions', 'Your completed workouts'], [Flame, totalSets, 'Sets logged', 'Every set you actually completed'], [TrendingUp, minutes, 'Minutes', 'Your recorded training time']].map(([Icon, value, label, description]) => {
        const StatIcon = Icon as typeof Dumbbell;
        return <button key={String(label)} onClick={() => navigate('dashboard')}><StatIcon size={32} /><div><p><strong>{String(value)}</strong><span>{String(label)}</span></p><small>{String(description)}</small></div></button>;
      })}</section>
    </div>
  </div>;
}
