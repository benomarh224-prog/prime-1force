import { NextResponse } from 'next/server';
import { findFallbackUser } from '@/lib/auth-users';
import { ensureAuthSchema } from '@/lib/auth-schema';
import { db } from '@/lib/db';

function isEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = isEmail(body.email) ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address' },
      { status: 400 }
    );
  }

  try {
    await ensureAuthSchema();
    await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch {
    await findFallbackUser(email).catch(() => null);
  }

  return NextResponse.json({
    success: true,
    message: 'If an account exists for that email, password reset instructions will be sent.',
  });
}
