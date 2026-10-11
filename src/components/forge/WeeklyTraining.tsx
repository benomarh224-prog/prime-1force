'use client';

import { Check } from 'lucide-react';
import { getTrainingWeek } from '@/lib/training-overview';
import type { WorkoutLog } from '@/lib/store';

export function WeeklyTraining({ logs, goal }: { logs: WorkoutLog[]; goal: number }) {
  const week = getTrainingWeek(logs);
  const target = Number.isFinite(goal) ? Math.max(1, Math.floor(goal)) : 5;
  return <section className="weekly-training" aria-label="Your training this week">
    <div className="weekly-training-heading"><div><p className="ref-kicker">THIS WEEK</p><h2>Small steps. Real progress.</h2></div><span><strong>{week.sessions}</strong> / {target} sessions</span></div>
    <div className="weekly-training-days">{week.days.map(day => <div key={day.key} className={(day.sessions ? 'is-complete ' : '') + (day.isToday ? 'is-today ' : '') + (day.isFuture ? 'is-future' : '')} aria-label={`${day.label}, ${day.key}: ${day.sessions ? day.sessions + ' completed session' + (day.sessions === 1 ? '' : 's') : day.isFuture ? 'upcoming' : 'no recorded sessions'}${day.isToday ? ', today' : ''}`} aria-current={day.isToday ? 'date' : undefined}><span>{day.label}</span><i>{day.sessions ? <Check size={18} /> : day.isToday ? <span className="weekly-today-dot" /> : '—'}</i>{day.sessions > 1 && <small>×{day.sessions}</small>}</div>)}</div>
    <p>{week.sessions ? `${week.sets} sets completed this week.` : 'Your first completed session will light up a day.'} {week.sessions >= target ? 'Weekly goal reached.' : `${Math.max(0, target - week.sessions)} sessions to your weekly goal.`}</p>
  </section>;
}
