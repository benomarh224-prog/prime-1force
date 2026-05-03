import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { aiCoachRequestSchema } from '@/lib/validations';
import { sanitizeInput } from '@/middleware';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    const sanitized = sanitizeInput(body) as Record<string, unknown>;
    const result = aiCoachRequestSchema.safeParse(sanitized);

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

    const { messages } = result.data;

    const zai = await getZAI();

    const completion = await zai.chat.completions.create({
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, response });
  } catch (error: unknown) {
    // Hide sensitive errors in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[AI Coach] Error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
