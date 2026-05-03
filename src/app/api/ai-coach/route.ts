import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { aiCoachRequestSchema } from '@/lib/validations';
import { sanitizeInput } from '@/proxy';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

function getLatestUserMessage(messages: { role: string; content: string }[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function getLocalCoachResponse(messages: { role: string; content: string }[]) {
  const latest = getLatestUserMessage(messages).toLowerCase();

  if (latest.includes('meal') || latest.includes('eat') || latest.includes('nutrition') || latest.includes('protein')) {
    return [
      '**Nutrition game plan**',
      '',
      'Aim for a simple plate structure: lean protein, slow carbs, colorful vegetables, and a small serving of healthy fats. For most training days, a strong target is **1.6-2.2g protein per kg body weight**, then adjust carbs based on energy and goal.',
      '',
      '**Before training:** eat 1-2 hours before if possible: banana + Greek yogurt, oats + whey, rice + chicken, or toast + eggs. Keep fats lower before intense sessions so digestion feels lighter.',
      '',
      '**After training:** prioritize protein and carbs within a few hours. Example: chicken/rice, tuna sandwich, protein shake + fruit, or eggs + potatoes.',
      '',
      'Small daily consistency beats perfect meal plans. Keep it clean, repeatable, and realistic.'
    ].join('\n');
  }

  if (latest.includes('motivat') || latest.includes('discipline') || latest.includes('tough') || latest.includes('lazy')) {
    return [
      '**Motivation reset**',
      '',
      'Do not wait to feel ready. Start with the smallest useful action: put on training clothes, do a 5-minute warm-up, or complete one easy set. Momentum usually arrives after you begin.',
      '',
      '**Today\'s rule:** make the workout so easy you cannot say no. If energy is low, do 3 rounds of push-ups, squats, rows, and plank. If energy rises, continue.',
      '',
      'Your standard is not intensity every day. Your standard is showing up.'
    ].join('\n');
  }

  if (latest.includes('back pain') || latest.includes('lower back') || latest.includes('pain') || latest.includes('injury')) {
    return [
      '**Back-friendly training note**',
      '',
      'If pain is sharp, radiating, or getting worse, pause hard training and check with a medical professional. For general stiffness, focus on controlled movement and core stability.',
      '',
      '**Gentle routine:**',
      '- Cat-cow: 2 x 8 slow reps',
      '- Bird dog: 3 x 8 each side',
      '- Glute bridge: 3 x 12',
      '- Dead bug: 3 x 8 each side',
      '- Easy walk: 10-20 minutes',
      '',
      'Avoid heavy spinal loading until movement feels clean and pain-free.'
    ].join('\n');
  }

  if (latest.includes('beginner') || latest.includes('plan') || latest.includes('workout') || latest.includes('routine')) {
    return [
      '**Beginner 4-week workout plan**',
      '',
      'Train **3 days per week** with at least one rest day between sessions. Keep 1-2 reps in reserve on every set and focus on clean form.',
      '',
      '**Workout A**',
      '- Squat or leg press: 3 x 8-10',
      '- Push-ups or chest press: 3 x 8-12',
      '- Dumbbell row: 3 x 10 each side',
      '- Plank: 3 x 30-45 sec',
      '',
      '**Workout B**',
      '- Romanian deadlift: 3 x 8-10',
      '- Shoulder press: 3 x 8-10',
      '- Lat pulldown: 3 x 10-12',
      '- Walking lunges: 2 x 10 each leg',
      '',
      '**Progression:** each week add 1-2 reps or a small amount of weight when form stays strong. Rest 60-90 seconds between sets.'
    ].join('\n');
  }

  return [
    '**Coach answer**',
    '',
    'Here is a simple, effective approach: pick one main goal, train consistently 3-5 times per week, and track the basics: exercises, sets, reps, weight, sleep, and energy.',
    '',
    '**Training structure:**',
    '- Start with 5-8 minutes of warm-up',
    '- Do 4-6 exercises per workout',
    '- Use 2-4 working sets per exercise',
    '- Rest 60-120 seconds depending on difficulty',
    '- Add weight or reps gradually',
    '',
    'Ask me for a specific plan by telling me your goal, equipment, level, and days per week.'
  ].join('\n');
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

    let response: string | undefined;

    try {
      const zai = await getZAI();

      const completion = await zai.chat.completions.create({
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        thinking: { type: 'disabled' },
      });

      response = completion.choices[0]?.message?.content;
    } catch (error) {
      console.warn('[AI Coach] Falling back to local coach response:', error instanceof Error ? error.message : 'Unknown error');
      response = getLocalCoachResponse(messages);
    }

    if (!response) {
      response = getLocalCoachResponse(messages);
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
