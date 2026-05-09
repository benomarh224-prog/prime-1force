import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  defaultSchedule,
  ensureDefaultProgram,
  getScheduleUserId,
  parseExercises,
  weekDays,
} from '@/lib/schedule';

type ScheduleDayInput = {
  id?: string;
  dayOfWeek: number;
  splitTitle: string;
  exercises?: string[];
  notes?: string | null;
  isRestDay?: boolean;
};

function persistenceDisabled() {
  return !process.env.DATABASE_URL;
}

function publicError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('DATABASE_URL') || message.includes('Environment variable not found')) {
    return 'Training plan cloud sync is not configured yet. Your planner can still run locally.';
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

function serializeDay(day: {
  id: string;
  dayOfWeek: number;
  splitTitle: string;
  exercises: string | null;
  notes: string | null;
  isRestDay: boolean;
  updatedAt: Date;
}) {
  return {
    ...day,
    dayName: weekDays[day.dayOfWeek],
    exercises: parseExercises(day.exercises),
    updatedAt: day.updatedAt.toISOString(),
  };
}

function serializeFallbackDay(day: {
  id?: string;
  dayOfWeek: number;
  splitTitle: string;
  exercises: string[];
  notes?: string | null;
  isRestDay: boolean;
}) {
  return {
    id: day.id || `fallback-${day.dayOfWeek}`,
    dayOfWeek: day.dayOfWeek,
    splitTitle: day.splitTitle,
    exercises: day.exercises,
    notes: day.notes || null,
    isRestDay: day.isRestDay,
    dayName: weekDays[day.dayOfWeek],
    updatedAt: new Date().toISOString(),
  };
}

function getFallbackScheduleResponse() {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = defaultSchedule.map((day) => serializeFallbackDay({ ...day, notes: null }));
  const todayDay = days.find((day) => day.dayOfWeek === today.getDay()) ?? days[0];

  return {
    success: true,
    persistence: 'disabled',
    programs: [
      {
        id: 'fallback-program',
        name: 'Push / Pull / Legs',
        description: 'A balanced six-day split with one recovery day.',
        isActive: true,
        createdAt: today.toISOString(),
      },
    ],
    activeProgram: {
      id: 'fallback-program',
      name: 'Push / Pull / Legs',
      description: 'A balanced six-day split with one recovery day.',
      isActive: true,
    },
    days,
    today: {
      ...todayDay,
      date: todayDate.toISOString(),
      completed: false,
      completionId: null,
    },
    history: [],
  };
}

function normalizeDays(days: ScheduleDayInput[]) {
  return days
    .filter((day) => Number.isInteger(day.dayOfWeek) && day.dayOfWeek >= 0 && day.dayOfWeek <= 6)
    .map((day) => {
      const exercises = Array.isArray(day.exercises)
        ? day.exercises.map((item) => String(item).trim()).filter(Boolean)
        : [];

      return {
        dayOfWeek: day.dayOfWeek,
        splitTitle: day.isRestDay ? 'Rest Day' : (day.splitTitle || '').trim() || 'Workout',
        exercises,
        notes: day.notes?.trim() || null,
        isRestDay: Boolean(day.isRestDay),
      };
    });
}

function fallbackProgramResponse(input: {
  id?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  days?: ScheduleDayInput[];
}) {
  const normalizedDays = normalizeDays(input.days || []);
  const fallbackDays = (normalizedDays.length ? normalizedDays : defaultSchedule.map((day) => ({ ...day, notes: null })))
    .map((day) => serializeFallbackDay(day));

  return {
    id: input.id || `fallback-program-${Date.now()}`,
    name: input.name?.trim() || 'Push / Pull / Legs',
    description: input.description ?? null,
    isActive: input.isActive ?? true,
    days: fallbackDays,
  };
}

export async function GET(request: Request) {
  try {
    if (persistenceDisabled()) {
      return NextResponse.json(getFallbackScheduleResponse());
    }

    const userId = await getScheduleUserId();
    const url = new URL(request.url);
    const requestedProgramId = url.searchParams.get('programId');
    const fallbackProgramId = await ensureDefaultProgram(userId);
    const programId = requestedProgramId || fallbackProgramId;

    const program = await db.workoutProgram.findFirst({
      where: { id: programId, userId },
      include: {
        days: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
    }

    const programs = await db.workoutProgram.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayDay = program.days.find((day) => day.dayOfWeek === today.getDay());
    const todayCompletion = await db.workoutCompletion.findUnique({
      where: {
        userId_programId_date: {
          userId,
          programId: program.id,
          date: todayDate,
        },
      },
    });

    const history = await db.workoutCompletion.findMany({
      where: { userId, programId: program.id },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      programs: programs.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      activeProgram: {
        id: program.id,
        name: program.name,
        description: program.description,
        isActive: program.isActive,
      },
      days: program.days.map(serializeDay),
      today: todayDay
        ? {
            ...serializeDay(todayDay),
            date: todayDate.toISOString(),
            completed: Boolean(todayCompletion),
            completionId: todayCompletion?.id ?? null,
          }
        : null,
      history: history.map((item) => ({
        ...item,
        date: item.date.toISOString(),
        completedAt: item.completedAt.toISOString(),
        dayName: weekDays[item.dayOfWeek],
      })),
    });
  } catch (error) {
    if (isPersistenceError(error)) {
      return NextResponse.json(getFallbackScheduleResponse());
    }

    const message = publicError(error, 'Failed to fetch schedule');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let fallbackProgram: ReturnType<typeof fallbackProgramResponse> | null = null;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'New Program';
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const requestedDays = Array.isArray(body.days) ? normalizeDays(body.days as ScheduleDayInput[]) : [];
    const daysToCreate = requestedDays.length > 0
      ? requestedDays
      : defaultSchedule.map((day) => ({ ...day, notes: null }));
    fallbackProgram = fallbackProgramResponse({
      name,
      description,
      isActive,
      days: daysToCreate,
    });

    if (persistenceDisabled()) {
      return NextResponse.json(
        {
          success: true,
          persistence: 'disabled',
          program: fallbackProgram,
        },
        { status: 201 }
      );
    }

    const userId = await getScheduleUserId();
    const program = await db.workoutProgram.create({
      data: {
        userId,
        name,
        description,
        isActive,
        days: {
          create: daysToCreate.map((day) => ({
            userId,
            dayOfWeek: day.dayOfWeek,
            splitTitle: day.splitTitle,
            exercises: JSON.stringify(day.exercises),
            notes: day.notes,
            isRestDay: day.isRestDay,
          })),
        },
      },
      include: { days: { orderBy: { dayOfWeek: 'asc' } } },
    });

    if (isActive) {
      await db.workoutProgram.updateMany({
        where: { userId, id: { not: program.id } },
        data: { isActive: false },
      });
    }

    return NextResponse.json(
      {
        success: true,
        program: {
          id: program.id,
          name: program.name,
          description: program.description,
          isActive: program.isActive,
          days: program.days.map(serializeDay),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (fallbackProgram && isPersistenceError(error)) {
      return NextResponse.json(
        {
          success: true,
          persistence: 'disabled',
          program: fallbackProgram,
        },
        { status: 201 }
      );
    }

    const message = publicError(error, 'Failed to create program');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let fallbackProgram: ReturnType<typeof fallbackProgramResponse> | null = null;

  try {
    const body = await request.json();
    const days = Array.isArray(body.days) ? (body.days as ScheduleDayInput[]) : [];
    const fallbackProgramId = typeof body.programId === 'string' && body.programId ? body.programId : 'fallback-program';
    fallbackProgram = fallbackProgramResponse({
      id: fallbackProgramId,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Push / Pull / Legs',
      description: typeof body.description === 'string' ? body.description.trim() : null,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      days,
    });

    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        activeProgram: {
          id: fallbackProgram.id,
          name: fallbackProgram.name,
          description: fallbackProgram.description,
          isActive: fallbackProgram.isActive,
        },
        days: fallbackProgram.days,
      });
    }

    const userId = await getScheduleUserId();
    const programId = typeof body.programId === 'string' ? body.programId : await ensureDefaultProgram(userId);

    const program = await db.workoutProgram.findFirst({
      where: { id: programId, userId },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
    }

    if (typeof body.name === 'string' || typeof body.description === 'string' || typeof body.isActive === 'boolean') {
      await db.workoutProgram.update({
        where: { id: programId },
        data: {
          ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
          ...(typeof body.description === 'string' ? { description: body.description.trim() } : {}),
          ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        },
      });

      if (body.isActive === true) {
        await db.workoutProgram.updateMany({
          where: { userId, id: { not: programId } },
          data: { isActive: false },
        });
      }
    }

    for (const day of days) {
      if (!Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6) continue;

      const splitTitle = day.isRestDay ? 'Rest Day' : (day.splitTitle || '').trim() || 'Workout';
      const exercises = Array.isArray(day.exercises)
        ? day.exercises.map((item) => String(item).trim()).filter(Boolean)
        : [];

      await db.workoutScheduleDay.upsert({
        where: {
          userId_programId_dayOfWeek: {
            userId,
            programId,
            dayOfWeek: day.dayOfWeek,
          },
        },
        create: {
          userId,
          programId,
          dayOfWeek: day.dayOfWeek,
          splitTitle,
          exercises: JSON.stringify(exercises),
          notes: day.notes?.trim() || null,
          isRestDay: Boolean(day.isRestDay),
        },
        update: {
          splitTitle,
          exercises: JSON.stringify(exercises),
          notes: day.notes?.trim() || null,
          isRestDay: Boolean(day.isRestDay),
        },
      });
    }

    const updated = await db.workoutProgram.findUnique({
      where: { id: programId },
      include: { days: { orderBy: { dayOfWeek: 'asc' } } },
    });

    return NextResponse.json({
      success: true,
      activeProgram: updated
        ? {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            isActive: updated.isActive,
          }
        : null,
      days: updated?.days.map(serializeDay) ?? [],
    });
  } catch (error) {
    if (fallbackProgram && isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
        activeProgram: {
          id: fallbackProgram.id,
          name: fallbackProgram.name,
          description: fallbackProgram.description,
          isActive: fallbackProgram.isActive,
        },
        days: fallbackProgram.days,
      });
    }

    const message = publicError(error, 'Failed to update schedule');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let hasProgramId = false;

  try {
    const url = new URL(request.url);
    const programId = url.searchParams.get('programId');

    if (!programId) {
      return NextResponse.json({ success: false, error: 'programId is required' }, { status: 400 });
    }

    hasProgramId = true;

    if (persistenceDisabled()) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const userId = await getScheduleUserId();
    const programCount = await db.workoutProgram.count({ where: { userId } });
    if (programCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'At least one workout program is required' },
        { status: 400 }
      );
    }

    await db.workoutProgram.delete({
      where: { id: programId, userId },
    });

    await ensureDefaultProgram(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (hasProgramId && isPersistenceError(error)) {
      return NextResponse.json({
        success: true,
        persistence: 'disabled',
      });
    }

    const message = publicError(error, 'Failed to delete program');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
