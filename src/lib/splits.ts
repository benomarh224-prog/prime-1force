import { exercises } from '@/lib/data';
import type { LabMovement, LabPlan, Muscle } from '@/lib/lab';

export type SplitId = 'push' | 'pull' | 'legs';
function movement(id: string, muscles: Muscle[]): LabMovement {
  const exercise = exercises.find(item => item.id === id)!;
  return { id, name: exercise.name, muscles, steps: exercise.steps };
}
export const trainingSplits = [
  { id: 'push', label: 'PUSH', muscles: 'Chest · Shoulders · Triceps', image: '/images/primeforge-push-ref.webp', description: 'Press with control. Build your upper-body pushing strength.', movements: [movement('bench-press', ['chest', 'shoulders', 'arms']), movement('shoulder-press-machine', ['shoulders', 'arms']), movement('cable-triceps-pushdown', ['arms'])] },
  { id: 'pull', label: 'PULL', muscles: 'Back · Biceps · Rear delts', image: '/images/primeforge-pull-ref.webp', description: 'Pull with purpose. Train your back and arms through a balanced session.', movements: [movement('lat-pulldown', ['back', 'arms']), movement('seated-row-machine', ['back', 'arms']), movement('bicep-curl', ['arms'])] },
  { id: 'legs', label: 'LEGS', muscles: 'Quads · Hamstrings · Glutes', image: '/images/primeforge-legs-ref.webp', description: 'Build your foundation. A focused session for your lower body.', movements: [movement('barbell-squat', ['legs', 'core']), movement('leg-extension-machine', ['legs']), { id: 'lab-glute-bridge', name: 'Glute bridge', muscles: ['legs', 'core'] as Muscle[], steps: ['Lie on your back with your feet flat and knees bent.', 'Press through your heels to lift your hips without arching your back.', 'Lower slowly and repeat with control.'] }] },
] satisfies Array<{ id: SplitId; label: string; muscles: string; image: string; description: string; movements: LabMovement[] }>;

export function buildSplitPlan(id: SplitId): LabPlan {
  const split = trainingSplits.find(item => item.id === id)!;
  return { name: split.label + ' session', config: { goal: 'muscle', equipment: 'gym', minutes: 35 }, movements: split.movements, sets: 3, reps: '8–12', rest: 75 };
}
