import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getScheduleUserId } from '@/lib/schedule';
import type { WorkoutExercise, WorkoutLog } from '@/lib/store';

type WorkoutSessionRecord = {
  id: string;
  name: string;
  date: Date;
  duration: number | null;
  notes: string | null;
  exercises: string | null;
  completed: boolean;
};

const LOCAL_WORKOUT_PREFIX = 'local-workout';

function persistenceDisabled() {
  return !process.env.DATABASE_URL;
}

function localWorkoutId(existingId?: unknown) {
  return typeof existingId === 'string' && existingId.trim()
    ? existingId
    : `${LOCAL_WORKOUT_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function publicError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('DATABASE_URL') || message.includes('Environment variable not found')) {
    return 'Workout cloud sync is not configured yet. Your workouts stay on this device.';
  }

  return message || fallback;
}

function isPersistenceError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return [
    'DATABASE_URL',
    'Environment variable not found',
    'Invalid `prisma.',
    'PrismaClient',
    'Error querying the database',
    'Unable to open the database file',
    'Can\'t reach database server',
    'no such table',
    'P1001',
    'P2021',
  ].some((needle) => message.includes(needle));
}

function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function parseExercises(value: unknown): WorkoutExercise[] {
  if (Array.isArray(value)) {
    return value
      .map((exercise) => ({
        exerciseId: String(exercise?.exerciseId || ''),
        exerciseName: String(exercise?.exerciseName || 'Exercise'),
        sets: Array.isArray(exercise?.sets)
          ? exercise.sets.map((set: { reps?: unknown; weight?: unknown }) => ({
              reps: Math.max(0, Number(set.reps) || 0),
              weight: Math.max(0, Number(set.weight) || 0),
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

function normalizeWorkout(input: Partial<WorkoutLog>): Omit<WorkoutLog, 'id'> {
  return {
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Workout',
    date: typeof input.date === 'string' && input.date ? input.date : dateKey(new Date()),
    duration: Math.max(0, Number(input.duration) || 0),
    notes: typeof input.notes === 'string' ? input.notes.trim() : '',
    completed: input.completed !== false,
    exercises: parseExercises(input.exercises),
  };
}

function serializeLocalWorkout(input: Partial<WorkoutLog>, existingId?: unknown): WorkoutLog {
  return {
    id: localWorkoutId(existingId ?? input.id),
    ...normalizeWorkout(input),
  };
}

function serializeSession(session: WorkoutSessionRecord): WorkoutLog {
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

export async function GET() {
  try {
    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const userId = await getScheduleUserId();
    const sessions = await db.workoutSession.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 150,
    });

    return NextResponse.json({
      success: true,
      workoutLogs: sessions.map(serializeSession),
    });
  } catch (error) {
    if (isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const message = publicError(error, 'Failed to fetch workouts');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let localWorkout: WorkoutLog | null = null;

  try {
    const body = await request.json();
    const workout = normalizeWorkout(body.workout || body);

    if (workout.exercises.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one exercise is required' }, { status: 400 });
    }

    localWorkout = serializeLocalWorkout(workout, body.workout?.id || body.id);

    if (persistenceDisabled()) {
      return NextResponse.json(
        {
          success: true,
          persistence: 'disabled',
          workout: localWorkout,
        },
        { status: 201 }
      );
    }

    const userId = await getScheduleUserId();
    const created = await db.workoutSession.create({
      data: {
        userId,
        name: workout.name,
        date: new Date(`${workout.date}T00:00:00`),
        duration: workout.duration,
        notes: workout.notes,
        exercises: JSON.stringify(workout.exercises),
        completed: Boolean(workout.completed),
      },
    });

    return NextResponse.json({ success: true, workout: serializeSession(created) }, { status: 201 });
  } catch (error) {
    if (localWorkout && isPersistenceError(error)) {
      return NextResponse.json(
        {
          success: true,
          persistence: 'disabled',
          workout: localWorkout,
        },
        { status: 201 }
      );
    }

    const message = publicError(error, 'Failed to save workout');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let localWorkout: WorkoutLog | null = null;

  try {
    const body = await request.json();
    const workoutId = typeof body.workoutId === 'string' ? body.workoutId : body.workout?.id;

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'workoutId is required' }, { status: 400 });
    }

    const workout = normalizeWorkout({ ...body.workout, id: workoutId });
    localWorkout = serializeLocalWorkout({ ...workout, id: workoutId }, workoutId);

    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        workout: localWorkout,
      });
    }

    const userId = await getScheduleUserId();
    await db.workoutSession.updateMany({
      where: { id: workoutId, userId },
      data: {
        name: workout.name,
        date: new Date(`${workout.date}T00:00:00`),
        duration: workout.duration,
        notes: workout.notes,
        exercises: JSON.stringify(workout.exercises),
        completed: Boolean(workout.completed),
      },
    });

    const updated = await db.workoutSession.findFirst({
      where: { id: workoutId, userId },
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, workout: serializeSession(updated) });
  } catch (error) {
    if (localWorkout && isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        workout: localWorkout,
      });
    }

    const message = publicError(error, 'Failed to update workout');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let hasWorkoutId = false;

  try {
    const url = new URL(request.url);
    const workoutId = url.searchParams.get('workoutId');

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'workoutId is required' }, { status: 400 });
    }

    hasWorkoutId = true;

    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const userId = await getScheduleUserId();
    await db.workoutSession.deleteMany({
      where: { id: workoutId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (hasWorkoutId && isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const message = publicError(error, 'Failed to delete workout');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
