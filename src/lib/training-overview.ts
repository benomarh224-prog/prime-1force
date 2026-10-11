import type { WorkoutLog } from '@/lib/store';
import { buildLabPlan, localDateKey, type LabConfig } from '@/lib/lab';
import { buildSplitPlan, trainingSplits } from '@/lib/splits';

export function mergeCompletedLogs(accountLogs: WorkoutLog[], deviceLogs: WorkoutLog[]) {
  // Deduplicate before filtering so a newer device record remains authoritative.
  return [...new Map([...accountLogs, ...deviceLogs].map(log => [log.id, log])).values()]
    .filter(log => log.completed !== false);
}

export function suggestTodayPlan(config: LabConfig, logs: WorkoutLog[]) {
  if (config.equipment !== 'gym') return buildLabPlan(config);
  const lastSplit = [...logs].sort((a, b) => b.date.localeCompare(a.date))
    .find(log => trainingSplits.some(split => log.name === split.label + ' session'));
  const previous = trainingSplits.findIndex(split => lastSplit?.name === split.label + ' session');
  return buildSplitPlan(trainingSplits[(previous + 1) % trainingSplits.length].id);
}

export function getTrainingWeek(logs: WorkoutLog[], today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() + 6) % 7);
  const todayKey = localDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    // Construct local dates instead of adding 24h across daylight-saving changes.
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = localDateKey(date);
    const sessions = key <= todayKey ? logs.filter(log => log.completed !== false && log.date.slice(0, 10) === key) : [];
    return {
      key, label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      sessions: sessions.length, isToday: key === todayKey, isFuture: key > todayKey,
      sets: sessions.reduce((total, log) => total + log.exercises.reduce((count, exercise) => count + exercise.sets.length, 0), 0),
    };
  });
  return { days, sessions: days.reduce((total, day) => total + day.sessions, 0), sets: days.reduce((total, day) => total + day.sets, 0) };
}
