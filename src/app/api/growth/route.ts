import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const growthItemSchema = z.object({
  kind: z.enum(['habit', 'goal', 'challenge', 'learning', 'task']),
  title: z.string().trim().min(1).max(160),
  details: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(64).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const updateSchema = growthItemSchema.partial().extend({
  id: z.string().min(1),
});

function sessionUserId(session: unknown) {
  return ((session as { user?: { id?: string } } | null)?.user)?.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = sessionUserId(session);
  if (!userId) {
    return NextResponse.json({ success: true, authenticated: false, items: [], focusSessions: [], journalEntries: [] });
  }

  const [items, focusSessions, journalEntries] = await Promise.all([
    db.growthItem.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    db.focusSession.findMany({ where: { userId }, orderBy: { completedAt: 'desc' }, take: 30 }),
    db.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  return NextResponse.json({ success: true, authenticated: true, items, focusSessions, journalEntries });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = sessionUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const parsed = growthItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid growth item', issues: parsed.error.flatten() }, { status: 400 });

  const item = await db.growthItem.create({
    data: {
      userId,
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      data: parsed.data.data ? JSON.stringify(parsed.data.data) : undefined,
    },
  });
  return NextResponse.json({ success: true, item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = sessionUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid update' }, { status: 400 });
  const { id, dueDate, data, ...updates } = parsed.data;

  const existing = await db.growthItem.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

  const item = await db.growthItem.update({
    where: { id },
    data: {
      ...updates,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
  return NextResponse.json({ success: true, item });
}
