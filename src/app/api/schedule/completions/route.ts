import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDefaultProgram, getScheduleUserId, toDateOnly, weekDays } from '@/lib/schedule';

function persistenceDisabled() {
  return !process.env.DATABASE_URL;
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

function publicError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  return isPersistenceError(error)
    ? 'Training completion cloud sync is not configured yet. Your planner can still run locally.'
    : message || fallback;
}

export async function GET(request: Request) {
  try {
    if (persistenceDisabled()) {
      return NextResponse.json({ success: true, persistence: 'disabled', history: [] });
    }

    const userId = await getScheduleUserId();
    const url = new URL(request.url);
    const programId = url.searchParams.get('programId') || await ensureDefaultProgram(userId);

    const history = await db.workoutCompletion.findMany({
      where: { userId, programId },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      history: history.map((item) => ({
        ...item,
        date: item.date.toISOString(),
        completedAt: item.completedAt.toISOString(),
        dayName: weekDays[item.dayOfWeek],
      })),
    });
  } catch (error) {
    if (isPersistenceError(error)) {
      return NextResponse.json({ success: true, persistence: 'disabled', history: [] });
    }

    const message = publicError(error, 'Failed to fetch completion history');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        completed: true,
        completion: null,
      });
    }

    const userId = await getScheduleUserId();
    const body = await request.json();
    const programId = typeof body.programId === 'string' ? body.programId : await ensureDefaultProgram(userId);
    const dayOfWeek = Number.isInteger(body.dayOfWeek) ? body.dayOfWeek : new Date().getDay();
    const date = body.date ? toDateOnly(new Date(body.date)) : toDateOnly(new Date());

    const scheduleDay = await db.workoutScheduleDay.findFirst({
      where: { userId, programId, dayOfWeek },
    });

    if (!scheduleDay) {
      return NextResponse.json({ success: false, error: 'Schedule day not found' }, { status: 404 });
    }

    const existing = await db.workoutCompletion.findUnique({
      where: {
        userId_programId_date: {
          userId,
          programId,
          date,
        },
      },
    });

    if (existing) {
      await db.workoutCompletion.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, completed: false, completion: null });
    }

    const completion = await db.workoutCompletion.create({
      data: {
        userId,
        programId,
        scheduleDayId: scheduleDay.id,
        date,
        dayOfWeek,
        splitTitle: scheduleDay.splitTitle,
        notes: typeof body.notes === 'string' ? body.notes.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      completed: true,
      completion: {
        ...completion,
        date: completion.date.toISOString(),
        completedAt: completion.completedAt.toISOString(),
        dayName: weekDays[completion.dayOfWeek],
      },
    });
  } catch (error) {
    if (isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        completed: true,
        completion: null,
      });
    }

    const message = publicError(error, 'Failed to update completion');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let hasCompletionId = false;

  try {
    if (persistenceDisabled()) {
      return NextResponse.json({ success: true, persistence: 'disabled' });
    }

    const url = new URL(request.url);
    const completionId = url.searchParams.get('id');

    if (!completionId) {
      return NextResponse.json({ success: false, error: 'Completion id is required' }, { status: 400 });
    }

    hasCompletionId = true;

    const userId = await getScheduleUserId();
    await db.workoutCompletion.deleteMany({
      where: { id: completionId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (hasCompletionId && isPersistenceError(error)) {
      return NextResponse.json({ success: true, persistence: 'disabled' });
    }

    const message = publicError(error, 'Failed to delete completion');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
