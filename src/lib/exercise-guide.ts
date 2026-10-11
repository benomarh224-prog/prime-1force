import type { Exercise } from '@/lib/data';
import type { Muscle } from '@/lib/lab';

export function exerciseMatchesMuscle(exercise: Exercise, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'Arms') return exercise.muscleGroup === 'Biceps' || exercise.muscleGroup === 'Triceps';
  return exercise.muscleGroup === filter;
}

export function musclesForFilter(filter: string): Muscle[] {
  const mapping: Record<string, Muscle> = { Chest: 'chest', Back: 'back', Shoulders: 'shoulders', Arms: 'arms', Biceps: 'arms', Triceps: 'arms', Core: 'core', Legs: 'legs' };
  return mapping[filter] ? [mapping[filter]] : [];
}
