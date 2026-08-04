import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  content: z.string().trim().min(1).max(20000),
  mood: z.number().int().min(1).max(5).optional(),
  gratitude: z.array(z.string().trim().max(240)).max(10).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid journal entry' }, { status: 400 });
  const entry = await db.journalEntry.create({
    data: { userId, content: parsed.data.content, mood: parsed.data.mood, gratitude: parsed.data.gratitude ? JSON.stringify(parsed.data.gratitude) : undefined },
  });
  return NextResponse.json({ success: true, entry }, { status: 201 });
}
