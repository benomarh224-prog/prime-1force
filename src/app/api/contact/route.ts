import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactSchema } from '@/lib/validations';
import { sanitizeInput } from '@/middleware';

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    const sanitized = sanitizeInput(body) as Record<string, unknown>;
    const result = contactSchema.safeParse(sanitized);

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

    const { name, email, subject, message } = result.data;

    // Sanitize final values before storage
    const cleanMessage = typeof message === 'string'
      ? message.replace(/<[^>]*>/g, '').trim()
      : message;
    const cleanName = typeof name === 'string'
      ? name.replace(/<[^>]*>/g, '').trim()
      : name;
    const cleanSubject = subject ? (typeof subject === 'string'
      ? subject.replace(/<[^>]*>/g, '').trim()
      : subject) : null;

    await db.contactMessage.create({
      data: {
        name: cleanName,
        email,
        message: cleanSubject ? `${cleanSubject}\n\n${cleanMessage}` : cleanMessage,
      },
    });

    // Return success — never expose internal IDs
    return NextResponse.json({
      success: true,
      message: 'Message received successfully',
    });
  } catch (error: unknown) {
    // Hide sensitive errors in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[Contact] Error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { success: false, error: 'An error occurred. Please try again later.' },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
