import { exercises } from '@/lib/data';

export type LabGoal = 'strength' | 'muscle' | 'fitness';
export type LabEquipment = 'gym' | 'dumbbells' | 'bodyweight';
export type LabMinutes = 20 | 35 | 50;
export type Muscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs';
export type LabConfig = { goal: LabGoal; equipment: LabEquipment; minutes: LabMinutes };
export type LabMovement = { id: string; name: string; muscles: Muscle[]; steps: string[] };
export type LabPlan = { name?: string; config: LabConfig; movements: LabMovement[]; sets: number; reps: string; rest: number };

export const muscleNames: Record<Muscle, string> = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', legs: 'Legs' };
export const goalNames: Record<LabGoal, string> = { strength: 'Strength', muscle: 'Muscle', fitness: 'Fitness' };
export const equipmentNames: Record<LabEquipment, string> = { gym: 'Gym', dumbbells: 'Dumbbells', bodyweight: 'Bodyweight' };

function gymMovement(id: string, muscles: Muscle[]): LabMovement {
  const exercise = exercises.find(item => item.id === id)!;
  return { id, name: exercise.name, muscles, steps: exercise.steps.slice(0, 3) };
}

const catalog: Record<LabEquipment, LabMovement[]> = {
  gym: [
    gymMovement('barbell-squat', ['legs', 'core']),
    gymMovement('chest-press-machine', ['chest', 'shoulders', 'arms']),
    gymMovement('seated-row-machine', ['back', 'arms']),
    gymMovement('shoulder-press-machine', ['shoulders', 'arms']),
    gymMovement('leg-extension-machine', ['legs']),
  ],
  dumbbells: [
    { id: 'lab-goblet-squat', name: 'Goblet squat', muscles: ['legs', 'core'], steps: ['Hold one dumbbell close to your chest, feet about shoulder-width apart.', 'Sit down between your hips while keeping your chest lifted.', 'Push through your feet to stand, staying in a comfortable range.'] },
    { id: 'lab-floor-press', name: 'Dumbbell floor press', muscles: ['chest', 'arms'], steps: ['Lie on the floor with knees bent and a dumbbell in each hand.', 'Press the weights up above your chest with wrists straight.', 'Lower slowly until your upper arms gently touch the floor.'] },
    { id: 'lab-db-row', name: 'Dumbbell row', muscles: ['back', 'arms'], steps: ['Hinge at your hips, keeping your back neutral and knees slightly bent.', 'Pull the dumbbells toward your hips without twisting your torso.', 'Lower with control. Keep the movement comfortable.'] },
    { id: 'lab-db-press', name: 'Dumbbell shoulder press', muscles: ['shoulders', 'arms'], steps: ['Hold the dumbbells at shoulder height with your elbows slightly forward.', 'Press overhead without leaning back.', 'Lower slowly to the starting position.'] },
    { id: 'lab-db-rdl', name: 'Dumbbell Romanian deadlift', muscles: ['legs', 'back'], steps: ['Stand with soft knees and the dumbbells in front of your thighs.', 'Push your hips back, keeping the weights close and your back neutral.', 'Stand by bringing your hips forward, stopping within your comfortable range.'] },
  ],
  bodyweight: [
    { id: 'lab-body-squat', name: 'Bodyweight squat', muscles: ['legs', 'core'], steps: ['Stand with your feet about shoulder-width apart.', 'Bend your hips and knees, keeping your heels on the floor.', 'Stand back up with control. Use a comfortable depth.'] },
    { id: 'lab-push-up', name: 'Push-up', muscles: ['chest', 'shoulders', 'arms'], steps: ['Place your hands slightly wider than your shoulders. Keep your body in a straight line.', 'Lower your chest with your elbows at a comfortable angle.', 'Press back up. Use your knees or a sturdy elevated surface if needed.'] },
    { id: 'lab-dead-bug', name: 'Dead bug', muscles: ['core'], steps: ['Lie on your back with arms up and knees bent above your hips.', 'Extend one arm and the opposite leg slowly, keeping your lower back still.', 'Return and alternate sides. Count each side as one rep.'] },
    { id: 'lab-reverse-lunge', name: 'Reverse lunge', muscles: ['legs', 'core'], steps: ['Stand tall, then step one foot back.', 'Bend both knees through a comfortable range while keeping your balance.', 'Push through the front foot to return. Alternate sides; count each side as one rep.'] },
    { id: 'lab-glute-bridge', name: 'Glute bridge', muscles: ['legs', 'core'], steps: ['Lie on your back with feet flat and knees bent.', 'Lift your hips by pressing through your heels, without arching your back.', 'Lower slowly, keeping the movement controlled.'] },
  ],
};

export function buildLabPlan(config: LabConfig): LabPlan {
  const count = config.minutes === 20 ? 3 : config.minutes === 35 ? 4 : 5;
  const reps = config.goal === 'strength' ? (config.equipment === 'gym' ? '6–8' : '8–10') : config.goal === 'muscle' ? '10–12' : '12–15';
  return { config: { ...config }, movements: catalog[config.equipment].slice(0, count), sets: config.minutes === 20 ? 2 : config.minutes === 35 ? 3 : 4, reps, rest: config.goal === 'strength' ? 90 : config.goal === 'muscle' ? 60 : 45 };
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
