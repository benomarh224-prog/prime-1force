'use client';

import { ArrowRight, Clock3, Dumbbell } from 'lucide-react';
import { useAppStore, type WorkoutLog } from '@/lib/store';
import { useLabStore } from '@/lib/lab-store';
import { equipmentNames, goalNames, localDateKey } from '@/lib/lab';
import { suggestTodayPlan } from '@/lib/training-overview';

export function TodayWorkout({ logs }: { logs: WorkoutLog[] }) {
  const { config, draft, start } = useLabStore();
  const navigate = useAppStore(state => state.navigate);
  const plan = draft?.plan ?? suggestTodayPlan(config, logs);
  const completedToday = logs.filter(log => log.date.slice(0, 10) === localDateKey()).length;
  const doneSets = draft ? Object.values(draft.sets).flat().filter(set => set.done).length : 0;
  return <section className="today-workout" aria-labelledby="today-workout-title">
    <div className="today-workout-top"><p className="ref-kicker">{draft ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR WORKOUT TODAY'}</p><span>{draft ? `${doneSets} sets logged` : completedToday ? `${completedToday} session${completedToday === 1 ? '' : 's'} done today` : 'Ready when you are'}</span></div>
    <h2 id="today-workout-title">{plan.name ?? `${goalNames[plan.config.goal]} session`}</h2>
    <p>{draft ? 'Your saved sets are here. Continue your unfinished session.' : plan.config.equipment === 'gym' ? 'A simple push / pull / legs rotation. Change your setup anytime in Workouts.' : 'Built from your selected equipment, time and goal.'}</p>
    <div className="today-workout-meta"><span><Clock3 size={17} />{plan.config.minutes} min target</span><span><Dumbbell size={17} />{plan.movements.length} exercises · {plan.sets} sets each</span><span>{equipmentNames[plan.config.equipment]}</span></div>
    <div className="today-workout-bottom"><div className="today-workout-preview">{plan.movements.map(movement => <span key={movement.id}>{movement.name}</span>)}</div><button className="ref-button" onClick={() => { start(plan); navigate('workouts'); }}>{draft ? 'Continue workout' : 'Start workout'}<ArrowRight size={18} /></button></div>
  </section>;
}
