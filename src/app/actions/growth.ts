'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const titleSchema = z.string().trim().min(1).max(160);

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error('Authentication required');
  return userId;
}

export async function createHabitAction(formData: FormData) {
  const userId = await requireUserId();
  const title = titleSchema.parse(formData.get('title'));
  const category = z.string().trim().max(64).parse(formData.get('category') || 'Discipline');
  const item = await db.growthItem.create({ data: { userId, kind: 'habit', title, category } });
  revalidatePath('/');
  return { success: true, item };
}

export async function toggleGrowthItemAction(id: string, completed: boolean) {
  const userId = await requireUserId();
  const existing = await db.growthItem.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Growth item not found');
  const item = await db.growthItem.update({ where: { id }, data: { completed, progress: completed ? 100 : existing.progress } });
  revalidatePath('/');
  return { success: true, item };
}

export async function saveFocusSessionAction(duration: number, intention?: string) {
  const userId = await requireUserId();
  const safeDuration = z.number().int().min(1).max(480).parse(duration);
  const focusSession = await db.focusSession.create({ data: { userId, duration: safeDuration, intention: intention?.slice(0, 240) } });
  return { success: true, focusSession };
}
