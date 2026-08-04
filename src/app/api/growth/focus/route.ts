import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  duration: z.number().int().min(1).max(480),
  intention: z.string().trim().max(240).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid focus session' }, { status: 400 });
  const focusSession = await db.focusSession.create({ data: { userId, ...parsed.data } });
  return NextResponse.json({ success: true, focusSession }, { status: 201 });
}
