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
    const message = error instanceof Error ? error.message : 'Failed to fetch workouts';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getScheduleUserId();
    const body = await request.json();
    const workout = normalizeWorkout(body.workout || body);

    if (workout.exercises.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one exercise is required' }, { status: 400 });
    }

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
    const message = error instanceof Error ? error.message : 'Failed to save workout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getScheduleUserId();
    const body = await request.json();
    const workoutId = typeof body.workoutId === 'string' ? body.workoutId : body.workout?.id;

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'workoutId is required' }, { status: 400 });
    }

    const workout = normalizeWorkout({ ...body.workout, id: workoutId });

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
    const message = error instanceof Error ? error.message : 'Failed to update workout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getScheduleUserId();
    const url = new URL(request.url);
    const workoutId = url.searchParams.get('workoutId');

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'workoutId is required' }, { status: 400 });
    }

    await db.workoutSession.deleteMany({
      where: { id: workoutId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete workout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
