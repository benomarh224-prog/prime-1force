'use client';

import { ArrowRight, ChevronDown, Dumbbell } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLabStore } from '@/lib/lab-store';
import { mergeCompletedLogs } from '@/lib/training-overview';
import { WeeklyTraining } from '@/components/forge/WeeklyTraining';

export function ForgeProgressPage() {
  const workoutLogs = useAppStore(state => state.workoutLogs);
  const navigate = useAppStore(state => state.navigate);
  const history = useLabStore(state => state.history);
  const weeklyGoal = useAppStore(state => state.weeklyGoal);
  const logs = mergeCompletedLogs(workoutLogs, history).sort((a, b) => b.date.localeCompare(a.date));
  const minutes = logs.reduce((sum, log) => sum + log.duration, 0);
  const sets = logs.reduce((sum, log) => sum + log.exercises.reduce((total, exercise) => total + exercise.sets.length, 0), 0);
  return <div className="lab-page">
    <div className="lab-progress-heading"><div><p className="lab-eyebrow">PRIMEFORGE / YOUR PROGRESS</p><h1>THE WORK<br /><span>ADDS UP.</span></h1><p>Your real sessions. Your own pace.</p></div><button className="lab-primary" onClick={() => navigate('workouts')}>New session <ArrowRight size={17} /></button></div>
    <div className="lab-metrics">{[[logs.length, 'Sessions'], [sets, 'Sets completed'], [minutes, 'Minutes trained']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <WeeklyTraining logs={logs} goal={weeklyGoal} />
    <section className="lab-card"><div className="lab-card-heading"><h2>Saved sessions</h2><span className="lab-muted">Latest first</span></div>
      {logs.length ? logs.map(log => <details key={log.id} className="lab-history-item">
        <summary><Dumbbell size={20} /><div><strong>{log.name}</strong><small>{new Date(log.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {log.exercises.length} exercises</small></div><span>{log.duration} min</span><ChevronDown size={16} /></summary>
        <div className="lab-history-sets">{log.exercises.map((exercise, index) => <p key={exercise.exerciseId + index}><strong>{exercise.exerciseName}</strong><span>{exercise.sets.map(set => set.reps + ' reps' + (set.weight ? ' × ' + set.weight + ' kg' : '')).join(' · ')}</span></p>)}</div>
      </details>) : <div className="lab-empty"><Dumbbell size={30} /><h3>One session is a good start.</h3><p>Finish a session in the lab to see it here.</p><button className="lab-primary" onClick={() => navigate('workouts')}>Build my session <ArrowRight size={17} /></button></div>}
    </section><p className="lab-caption">Guest sessions are stored in this browser. Sign in before saving to sync new sessions when account storage is available.</p>
  </div>;
}
