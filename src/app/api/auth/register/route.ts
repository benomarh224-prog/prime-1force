import { NextResponse } from 'next/server';
import { ensureAuthSchema } from '@/lib/auth-schema';
import { createFallbackUser } from '@/lib/auth-users';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { sanitizeInput } from '@/proxy';
import bcrypt from 'bcryptjs';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sanitized = sanitizeInput(body) as Record<string, unknown>;
    const result = registerSchema.safeParse(sanitized);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { email, name, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    try {
      await ensureAuthSchema();

      const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          name,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully',
          user,
        },
        { status: 201 }
      );
    } catch (databaseError: unknown) {
      console.error('[Register] Primary database failed:', errorMessage(databaseError));

      const fallback = await createFallbackUser({ email: normalizedEmail, name, password });

      if (fallback.alreadyExists) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      if (!fallback.user) {
        throw databaseError;
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully',
          user: {
            id: fallback.user.id,
            email: fallback.user.email,
            name: fallback.user.name,
            role: fallback.user.role,
            createdAt: fallback.user.createdAt,
          },
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Register] Error:', errorMessage(error));
      return NextResponse.json(
        { success: false, error: 'Registration failed. Please try again later.' },
        { status: 500 }
      );
    }

    const message = errorMessage(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
