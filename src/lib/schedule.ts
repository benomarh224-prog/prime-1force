import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const defaultSchedule = [
  { dayOfWeek: 0, splitTitle: 'Rest Day', exercises: [], isRestDay: true },
  { dayOfWeek: 1, splitTitle: 'Push', exercises: ['Chest', 'Shoulders', 'Triceps'], isRestDay: false },
  { dayOfWeek: 2, splitTitle: 'Pull', exercises: ['Back', 'Biceps', 'Rear Delts'], isRestDay: false },
  { dayOfWeek: 3, splitTitle: 'Legs', exercises: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], isRestDay: false },
  { dayOfWeek: 4, splitTitle: 'Push', exercises: ['Chest', 'Shoulders', 'Triceps'], isRestDay: false },
  { dayOfWeek: 5, splitTitle: 'Pull', exercises: ['Back', 'Biceps', 'Core'], isRestDay: false },
  { dayOfWeek: 6, splitTitle: 'Legs + Conditioning', exercises: ['Legs', 'Abs', 'Cardio'], isRestDay: false },
];

export function parseExercises(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function getScheduleUserId() {
  let sessionUserId: string | undefined;

  if (authOptions.secret) {
    try {
      const session = await getServerSession(authOptions);
      sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    } catch (error) {
      console.warn(
        '[Schedule] Falling back to demo user because auth session lookup failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  if (sessionUserId) return sessionUserId;

  const demoUser = await db.user.upsert({
    where: { email: 'demo@primeforge.local' },
    update: {},
    create: {
      email: 'demo@primeforge.local',
      name: 'Demo Athlete',
    },
    select: { id: true },
  });

  return demoUser.id;
}

export async function ensureDefaultProgram(userId: string) {
  const existingActive = await db.workoutProgram.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });

  if (existingActive) return existingActive.id;

  const existingProgram = await db.workoutProgram.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (existingProgram) {
    await db.workoutProgram.update({
      where: { id: existingProgram.id },
      data: { isActive: true },
    });
    return existingProgram.id;
  }

  const program = await db.workoutProgram.create({
    data: {
      userId,
      name: 'Push / Pull / Legs',
      description: 'A balanced six-day split with one recovery day.',
      isActive: true,
      days: {
        create: defaultSchedule.map((day) => ({
          userId,
          dayOfWeek: day.dayOfWeek,
          splitTitle: day.splitTitle,
          exercises: JSON.stringify(day.exercises),
          isRestDay: day.isRestDay,
        })),
      },
    },
    select: { id: true },
  });

  return program.id;
}
