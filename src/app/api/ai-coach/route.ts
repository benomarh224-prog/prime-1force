import { NextResponse } from 'next/server';
import { aiCoachRequestSchema } from '@/lib/validations';
import { sanitizeInput } from '@/proxy';

type CoachMessage = { role: 'user' | 'assistant'; content: string };

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const AI_COACH_MODEL = process.env.AI_COACH_MODEL || 'gemini-3-flash-preview';
const AI_COACH_FALLBACK_MODEL = process.env.AI_COACH_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
const AI_COACH_FAST_FALLBACK_MODEL =
  process.env.AI_COACH_FAST_FALLBACK_MODEL || process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
const AI_COACH_SYSTEM_PROMPT = [
  'You are Prime Forge AI Coach, a high-performance strength, hypertrophy, conditioning, nutrition, and recovery coach.',
  'Answer like a real human coach: warm, conversational, concise when the user is just chatting, and decisive when they ask for fitness help.',
  'If the user says hi, hello, how are you, or similar small talk, reply naturally with a friendly greeting and ask how you can help today.',
  'When details are missing, make reasonable assumptions, give a complete usable plan first, then ask one short follow-up question at the end.',
  'For workouts, include exercises, sets, reps, rest times, intensity target, progression, warm-up, and recovery notes when useful.',
  'Format answers beautifully for a chat bubble: short intro, clear markdown headings, compact bullet lists, and no markdown tables unless absolutely necessary.',
  'If you need to show exercises, use bullets like "- Chest press: 3 x 8-10, 90s rest, RPE 8" instead of a table.',
  'For nutrition, include protein targets, calorie direction, meal timing, and simple food examples when useful.',
  'Personalize advice from the conversation and keep answers clear, direct, and actionable.',
  'Do not diagnose injuries or medical conditions. For sharp, worsening, radiating, or unexplained pain, recommend pausing hard training and consulting a qualified professional.',
].join(' ');

function getLatestUserMessage(messages: CoachMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function normalizeMessage(message: string) {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGreetingMessage(message: string) {
  const normalized = normalizeMessage(message);
  const greetingPatterns = [
    /^(hi|hey|hello|yo|sup)$/,
    /^(hi|hey|hello|yo|sup)\s+(coach|there|bro|man|friend)$/,
    /^(how are you|how r u|how ar u|how are u|how you doing|how is it going|whats up|what s up)$/,
    /^(hi|hey|hello).*(how are you|how r u|how ar u|how are u)$/,
  ];

  return greetingPatterns.some((pattern) => pattern.test(normalized));
}

function getLocalCoachResponse(messages: CoachMessage[]) {
  const latestMessage = getLatestUserMessage(messages);
  const latest = latestMessage.toLowerCase();

  if (isGreetingMessage(latestMessage)) {
    return 'Hi, how can I help you today?';
  }

  if (latest.includes('review') || latest.includes('progress') || latest.includes('improve')) {
    return [
      '**Weekly coaching review**',
      '',
      'Focus on three signals: completed sessions, progressive overload, and recovery. If you are not logging workouts yet, start there because the best plan is the one we can measure.',
      '',
      '**This week:**',
      '- Keep your main lifts consistent for 2-4 weeks',
      '- Add 1 rep or 1-2.5kg only when form is clean',
      '- Track sleep, energy, soreness, and appetite after each workout',
      '- If performance drops for 2 sessions in a row, reduce volume by 20-30%',
      '',
      '**Next 24 hours:** log one workout with exercises, sets, reps, weight, and one note about how it felt.'
    ].join('\n');
  }

  if (latest.includes('7-day') || latest.includes('week') || latest.includes('weekly')) {
    return [
      '**7-day training plan**',
      '',
      '**Day 1 - Push:** chest press machine 4 x 8-10, shoulder press machine 3 x 8-10, cable fly 3 x 12, cable triceps pushdown 3 x 12. Rest 90 sec.',
      '**Day 2 - Pull:** seated row machine 4 x 8, lat pulldown 3 x 10, rear delt fly 3 x 15, machine curls 3 x 10-12. Rest 75-90 sec.',
      '**Day 3 - Legs:** leg press 4 x 6-10, leg extension 3 x 12, leg curl 3 x 12, calves 3 x 15.',
      '**Day 4 - Recovery:** 25-40 min walk, mobility, easy core.',
      '**Day 5 - Upper:** chest press 3 x 10, cable row 3 x 10, lateral raise 3 x 15, arms 2-3 x 12.',
      '**Day 6 - Conditioning:** 8-12 intervals or a full-body circuit at moderate intensity.',
      '**Day 7 - Rest:** sleep, steps, hydration.',
      '',
      '**Progression:** add reps first, then weight. Keep 1-2 reps in reserve on most sets.'
    ].join('\n');
  }

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
      '- Seated row machine: 3 x 10',
      '- Cable crunch: 3 x 12-15',
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

function toGeminiContents(messages: CoachMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;

  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return undefined;

  return candidates
    .flatMap((candidate) => {
      const parts = (candidate as { content?: { parts?: unknown } }).content?.parts;
      return Array.isArray(parts) ? parts : [];
    })
    .map((part) => (part as { text?: unknown }).text)
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
    .join('\n')
    .trim();
}

async function generateGeminiCoachResponse(messages: CoachMessage[], model: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: AI_COACH_SYSTEM_PROMPT }],
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 1600,
      },
    }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object'
        ? (payload as { error?: { message?: string } }).error?.message
        : undefined;
    throw new Error(errorMessage || `Gemini request failed with status ${response.status}`);
  }

  const text = extractGeminiText(payload);
  if (!text) {
    throw new Error('Gemini response did not include text.');
  }

  return text;
}

async function getAiCoachResponse(messages: CoachMessage[]) {
  const models = Array.from(
    new Set([AI_COACH_MODEL, AI_COACH_FALLBACK_MODEL, AI_COACH_FAST_FALLBACK_MODEL].filter(Boolean))
  );
  let lastError: unknown;

  for (const model of models) {
    try {
      return await generateGeminiCoachResponse(messages, model);
    } catch (error) {
      lastError = error;
      console.warn(
        `[AI Coach] Gemini model ${model} failed:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini request failed.');
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
      response = await getAiCoachResponse(messages);
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
