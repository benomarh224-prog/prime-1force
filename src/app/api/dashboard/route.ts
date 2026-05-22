import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import {
  ensureFallbackSessionUser,
  findFallbackUserById,
  type AuthUser,
  type StoredWorkoutLog,
  updateFallbackUser,
} from '@/lib/auth-users';
import { ensureDashboardSchema } from '@/lib/dashboard-schema';
import { db } from '@/lib/db';
import type { WorkoutExercise, WorkoutLog } from '@/lib/store';

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
};

type ProfilePatch = {
  name?: string;
  avatar?: string;
  weight?: number;
  height?: number;
  goal?: string;
  level?: string;
  weeklyGoal?: number;
};

function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function parseExercises(value: unknown): WorkoutExercise[] {
  if (Array.isArray(value)) {
    return value
      .map((exercise) => ({
        exerciseId: String(exercise?.exerciseId || ''),
        exerciseName: String(exercise?.exerciseName || 'Exercise'),
        sets: Array.isArray(exercise?.sets)
          ? exercise.sets.map((set: { reps?: unknown; weight?: unknown }) => ({
              reps: Number(set.reps) || 0,
              weight: Number(set.weight) || 0,
            }))
          : [],
      }))
      .filter((exercise) => exercise.exerciseId && exercise.exerciseName);
  }

  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    return parseExercises(JSON.parse(value));
  } catch {
    return [];
  }
}

function normalizeWorkout(input: Partial<WorkoutLog>, fallbackId = randomUUID()): WorkoutLog {
  return {
    id: typeof input.id === 'string' && input.id ? input.id : fallbackId,
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Workout',
    date: typeof input.date === 'string' && input.date ? input.date : dateKey(new Date()),
    duration: Number(input.duration) || 0,
    notes: typeof input.notes === 'string' ? input.notes.trim() : '',
    completed: Boolean(input.completed),
    exercises: parseExercises(input.exercises),
  };
}

function profileFromFallback(user: AuthUser) {
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    weight: user.weight ?? 75,
    height: user.height ?? 175,
    goal: user.goal || 'lose_weight',
    level: user.level || 'intermediate',
    weeklyGoal: user.weeklyGoal ?? 5,
  };
}

function profileFromDbUser(user: {
  name: string | null;
  avatar: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  level: string | null;
  weeklyGoal: number | null;
}) {
  return {
    name: user.name || '',
    avatar: user.avatar || '',
    weight: user.weight ?? 75,
    height: user.height ?? 175,
    goal: user.goal || 'lose_weight',
    level: user.level || 'intermediate',
    weeklyGoal: user.weeklyGoal ?? 5,
  };
}

function sanitizeProfile(input: unknown): ProfilePatch {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const patch: ProfilePatch = {};

  if (typeof source.name === 'string') patch.name = source.name.trim().slice(0, 100);
  if (typeof source.avatar === 'string') patch.avatar = source.avatar.trim().slice(0, 64);
  if (typeof source.goal === 'string') patch.goal = source.goal.trim().slice(0, 64);
  if (typeof source.level === 'string') patch.level = source.level.trim().slice(0, 64);

  const weight = Number(source.weight);
  if (Number.isFinite(weight) && weight >= 30 && weight <= 300) patch.weight = weight;

  const height = Number(source.height);
  if (Number.isFinite(height) && height >= 100 && height <= 250) patch.height = height;

  const weeklyGoal = Number(source.weeklyGoal);
  if (Number.isInteger(weeklyGoal) && weeklyGoal >= 1 && weeklyGoal <= 14) patch.weeklyGoal = weeklyGoal;

  return patch;
}

function validateProfile(input: unknown) {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(source, key);

  if (hasOwn('weight')) {
    const weight = Number(source.weight);
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      return 'Weight must be between 30 and 300 kg';
    }
  }

  if (hasOwn('height')) {
    const height = Number(source.height);
    if (!Number.isFinite(height) || height < 100 || height > 250) {
      return 'Height must be between 100 and 250 cm';
    }
  }

  if (hasOwn('weeklyGoal')) {
    const weeklyGoal = Number(source.weeklyGoal);
    if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 14) {
      return 'Weekly workout goal must be between 1 and 14';
    }
  }

  return null;
}

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name || user.email.split('@')[0],
  };
}

async function ensureDbUser(sessionUser: { id: string; email: string; name: string }) {
  return db.user.upsert({
    where: { email: sessionUser.email },
    update: {},
    create: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
    },
  });
}

function serializeDbWorkout(session: {
  id: string;
  name: string;
  date: Date;
  duration: number | null;
  notes: string | null;
  exercises: string | null;
  completed: boolean;
}): WorkoutLog {
  return {
    id: session.id,
    name: session.name || 'Workout',
    date: dateKey(session.date),
    duration: session.duration ?? 0,
    notes: session.notes || '',
    completed: session.completed,
    exercises: parseExercises(session.exercises),
  };
}

function fallbackLogs(user: AuthUser): StoredWorkoutLog[] {
  return Array.isArray(user.workoutLogs) ? user.workoutLogs.map((log) => normalizeWorkout(log)) : [];
}

async function fallbackDashboard(sessionUser: { id: string; email: string; name: string }) {
  const user = await ensureFallbackSessionUser(sessionUser);

  return {
    success: true,
    persistence: 'fallback',
    profile: profileFromFallback(user),
    workoutLogs: fallbackLogs(user),
  };
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await ensureDashboardSchema();
    const user = await ensureDbUser(sessionUser);
    const sessions = await db.workoutSession.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      persistence: 'database',
      profile: profileFromDbUser(user),
      workoutLogs: sessions.map(serializeDbWorkout),
    });
  } catch (error: unknown) {
    console.error('[Dashboard] Falling back to file store:', getErrorMessage(error));
    return NextResponse.json(await fallbackDashboard(sessionUser));
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const profileError = body.profile ? validateProfile(body.profile) : null;
  if (profileError) {
    return NextResponse.json({ success: false, error: profileError }, { status: 400 });
  }

  const sanitizedProfile = body.profile ? sanitizeProfile(body.profile) : null;
  const profilePatch = sanitizedProfile && Object.keys(sanitizedProfile).length > 0 ? sanitizedProfile : null;
  const workoutId = typeof body.workoutId === 'string' ? body.workoutId : null;
  const workoutPatch = body.workout ? normalizeWorkout({ ...body.workout, id: workoutId || body.workout.id }) : null;

  try {
    await ensureDashboardSchema();
    const user = await ensureDbUser(sessionUser);
    let profile = profileFromDbUser(user);
    let workout: WorkoutLog | null = null;

    if (profilePatch) {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: profilePatch,
      });

      if (
        profilePatch.weight !== undefined &&
        (updatedUser.weight === null || Math.abs(updatedUser.weight - profilePatch.weight) > 0.001)
      ) {
        throw new Error('Profile weight was not persisted');
      }

      profile = profileFromDbUser(updatedUser);
    }

    if (workoutId && workoutPatch) {
      await db.workoutSession.updateMany({
        where: { id: workoutId, userId: user.id },
        data: {
          name: workoutPatch.name,
          date: new Date(`${workoutPatch.date}T00:00:00`),
          duration: workoutPatch.duration,
          notes: workoutPatch.notes,
          exercises: JSON.stringify(workoutPatch.exercises),
          completed: Boolean(workoutPatch.completed),
        },
      });

      const updatedWorkout = await db.workoutSession.findFirst({
        where: { id: workoutId, userId: user.id },
      });

      if (!updatedWorkout) {
        return NextResponse.json({ success: false, error: 'Workout not found' }, { status: 404 });
      }

      workout = serializeDbWorkout(updatedWorkout);
    }

    return NextResponse.json({ success: true, profile, workout });
  } catch (error: unknown) {
    console.error('[Dashboard] Patch fallback:', getErrorMessage(error));

    if (profilePatch) {
      return NextResponse.json(
        { success: false, error: 'Could not save profile to the database. Please try again.' },
        { status: 503 }
      );
    }

    const user = await ensureFallbackSessionUser(sessionUser);
    const patch: Partial<AuthUser> = {};
    let workout: StoredWorkoutLog | null = null;

    if (profilePatch) {
      Object.assign(patch, profilePatch);
    }

    if (workoutId && workoutPatch) {
      const logs = fallbackLogs(user).map((log) => (log.id === workoutId ? workoutPatch : log));
      workout = logs.find((log) => log.id === workoutId) || null;
      patch.workoutLogs = logs;
    }

    const updated = await updateFallbackUser(user.id, patch);
    return NextResponse.json({
      success: true,
      persistence: 'fallback',
      profile: profileFromFallback(updated || user),
      workout,
    });
  }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const workout = normalizeWorkout(body.workout || body);

  if (workout.exercises.length === 0) {
    return NextResponse.json({ success: false, error: 'At least one exercise is required' }, { status: 400 });
  }

  try {
    await ensureDashboardSchema();
    const user = await ensureDbUser(sessionUser);
    const created = await db.workoutSession.create({
      data: {
        userId: user.id,
        name: workout.name,
        date: new Date(`${workout.date}T00:00:00`),
        duration: workout.duration,
        notes: workout.notes,
        exercises: JSON.stringify(workout.exercises),
        completed: Boolean(workout.completed),
      },
    });

    return NextResponse.json({ success: true, workout: serializeDbWorkout(created) }, { status: 201 });
  } catch (error: unknown) {
    console.error('[Dashboard] Create fallback:', getErrorMessage(error));
    const user = await ensureFallbackSessionUser(sessionUser);
    const logs = [workout, ...fallbackLogs(user)];
    await updateFallbackUser(user.id, { workoutLogs: logs });
    return NextResponse.json({ success: true, persistence: 'fallback', workout }, { status: 201 });
  }
}

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(request.url);
  const workoutId = url.searchParams.get('workoutId');

  if (!workoutId) {
    return NextResponse.json({ success: false, error: 'workoutId is required' }, { status: 400 });
  }

  try {
    await ensureDashboardSchema();
    const user = await ensureDbUser(sessionUser);
    await db.workoutSession.deleteMany({
      where: { id: workoutId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Dashboard] Delete fallback:', getErrorMessage(error));
    const user = await findFallbackUserById(sessionUser.id) || await ensureFallbackSessionUser(sessionUser);
    const logs = fallbackLogs(user).filter((log) => log.id !== workoutId);
    await updateFallbackUser(user.id, { workoutLogs: logs });
    return NextResponse.json({ success: true, persistence: 'fallback' });
  }
}
