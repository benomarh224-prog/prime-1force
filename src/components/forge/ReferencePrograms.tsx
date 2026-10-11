'use client';

import Image from 'next/image';
import { ArrowRight, Check, Clock3, Dumbbell } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLabStore } from '@/lib/lab-store';
import { buildSplitPlan, trainingSplits } from '@/lib/splits';
import { exercises } from '@/lib/data';
import { ExerciseDemo } from '@/components/forge/ExerciseDemo';

export function ReferencePrograms() {
  const { selectedSplit, selectSplit, draft, start } = useLabStore();
  const navigate = useAppStore(state => state.navigate);
  const split = trainingSplits.find(item => item.id === selectedSplit) ?? trainingSplits[0];
  const plan = buildSplitPlan(split.id);
  return <div className="ref-container ref-programs">
    <div className="ref-page-heading"><p className="ref-kicker">THE TRAINING SPLITS</p><h1>CHOOSE YOUR <span>FOCUS.</span></h1><p>Three simple sessions. Preview the movements, then make every set count.</p></div>
    <div className="ref-split-grid" role="group" aria-label="Select a split">{trainingSplits.map(item => <button key={item.id} className={'ref-split-card ' + (item.id === split.id ? 'is-active' : '')} aria-pressed={item.id === split.id} onClick={() => selectSplit(item.id)}><Image unoptimized loading="eager" src={item.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /><div className="ref-split-shade" /><div className="ref-split-copy"><h2>{item.label}</h2><p>{item.muscles}</p></div><span className="ref-card-arrow">{item.id === split.id ? <Check size={18} /> : <ArrowRight size={18} />}</span></button>)}</div>
    <section className="ref-plan"><div className="ref-plan-intro"><p className="ref-kicker">YOUR SELECTED SESSION</p><h2>{split.label}</h2><p>{split.description}</p><div className="ref-plan-facts"><span><Dumbbell size={16} />Gym equipment</span><span><Clock3 size={16} />35 min target</span></div><button className="ref-button" onClick={() => { if (!draft) start(plan); navigate('workouts'); }}>{draft ? 'Continue saved session' : 'Start ' + split.label.toLowerCase() + ' session'}<ArrowRight size={18} /></button><small>{draft ? 'Your unfinished session stays intact. Finish or discard it before starting another.' : '3 sets per exercise · 8–12 reps · 75s rest. Adjust the load to your level.'}</small></div><div className="ref-plan-movements">{split.movements.map((item, index) => {
      const demo = exercises.find(exercise => exercise.id === item.id);
      return <details key={item.id}><summary><span>0{index + 1}</span><strong>{item.name}</strong><small>3 × 8–12</small></summary>{demo && <ExerciseDemo key={demo.id} exercise={demo} />}<ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol></details>;
    })}</div></section>
    <p className="lab-safety">Warm up first and choose a comfortable load. Time estimates vary with your pace. Stop if you feel pain.</p>
  </div>;
}
