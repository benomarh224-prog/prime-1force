import { NextResponse } from 'next/server';
import { aiCoachRequestSchema } from '@/lib/validations';
import { sanitizeInput } from '@/proxy';

type CoachMessage = { role: 'user' | 'assistant'; content: string };
type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type OpenAIChatCompletionResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    type?: string;
    code?: string;
    message?: string;
  };
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

type ProviderResult = {
  provider: 'openai' | 'gemini' | 'local';
  model: string;
  response: string;
};

const OPENAI_API_BASE_URL = (process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_AI_COACH_MODEL = process.env.OPENAI_AI_COACH_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_AI_COACH_MODEL =
  process.env.GEMINI_MODEL ||
  (process.env.AI_COACH_MODEL?.toLowerCase().startsWith('gemini') ? process.env.AI_COACH_MODEL : undefined) ||
  'gemini-1.5-flash';

const AI_COACH_TIMEOUT_MS = boundedInteger(process.env.AI_COACH_TIMEOUT_MS, 30000, 1000, 120000);
const AI_COACH_MAX_TOKENS = 1200;
const AI_COACH_TEMPERATURE = 0.4;
const MAX_HISTORY_MESSAGES = 24;

const PRIMEFORGE_SYSTEM_PROMPT = [
  'You are PrimeForge AI Coach, an expert personal trainer, nutrition coach, and fitness mentor.',
  'Provide personalized workout advice, nutrition guidance, recovery recommendations, and exercise technique corrections.',
  'Always ask for missing information when necessary.',
  'Give specific sets, reps, rest periods, progression advice, and safety recommendations.',
  'Avoid generic answers.',
  'Use clear formatting and bullet points.',
  'Answer in the same language as the latest user message. If the user writes Arabic or Moroccan Darija, answer naturally in Arabic/Darija.',
  'Use the conversation history and the user profile context when available. Do not ignore previous questions.',
  'If the user asks something outside fitness, answer briefly and helpfully, then offer to connect it back to training only when useful.',
  'Never diagnose medical conditions. For severe, sharp, radiating, worsening, or unexplained pain, recommend stopping intense training and consulting a qualified professional.',
].join('\n');

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function getCurrentDateContext() {
  const now = new Date();
  const moroccoNow = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Casablanca',
  }).format(now);

  return `Current date/time: ${now.toISOString()}. Morocco local time: ${moroccoNow}.`;
}

function getSystemPrompt(extraContext: string) {
  return [PRIMEFORGE_SYSTEM_PROMPT, getCurrentDateContext(), extraContext].filter(Boolean).join('\n\n');
}

function logAiCoach(level: 'info' | 'warn' | 'error', event: string, details: Record<string, unknown> = {}) {
  const payload = {
    event,
    ...details,
  };

  if (level === 'error') {
    console.error('[AI Coach]', payload);
  } else if (level === 'warn') {
    console.warn('[AI Coach]', payload);
  } else {
    console.info('[AI Coach]', payload);
  }
}

function getEnvStatus() {
  return {
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    openAiModel: OPENAI_AI_COACH_MODEL,
    openAiBaseUrl: OPENAI_API_BASE_URL,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    geminiModel: GEMINI_AI_COACH_MODEL,
    maxTokens: AI_COACH_MAX_TOKENS,
    temperature: AI_COACH_TEMPERATURE,
    timeoutMs: AI_COACH_TIMEOUT_MS,
  };
}

function normalizeMessages(messages: CoachMessage[]) {
  const cleanMessages = messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);

  let extraContext = '';
  const conversation = [...cleanMessages];

  if (conversation[0]?.role === 'assistant') {
    extraContext = conversation.shift()?.content || '';
  }

  return {
    extraContext,
    conversation: conversation.slice(-MAX_HISTORY_MESSAGES),
  };
}

function toOpenAiMessages(messages: CoachMessage[]): OpenAIMessage[] {
  const { extraContext, conversation } = normalizeMessages(messages);

  return [
    {
      role: 'system',
      content: getSystemPrompt(extraContext),
    },
    ...conversation.map((message): OpenAIMessage => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function toGeminiPayload(messages: CoachMessage[]) {
  const { extraContext, conversation } = normalizeMessages(messages);

  return {
    systemInstruction: getSystemPrompt(extraContext),
    contents: conversation.map((message): GeminiContent => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  };
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;

  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return undefined;

  const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  const text = parts
    .map((part) => (part as { text?: unknown }).text)
    .filter((part): part is string => typeof part === 'string')
    .join('\n')
    .trim();

  return text || undefined;
}

function getLatestUserMessage(messages: CoachMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function isArabicLikeMessage(message: string) {
  const lower = message.toLowerCase();
  return /[\u0600-\u06FF]/.test(message) || ['wach', 'bghit', 'chno', 'kifach', 'salam', 'labas'].some((term) => lower.includes(term));
}

function isDateOrTimeQuestion(message: string) {
  const normalized = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return (
    /\b(what is today'?s date|today'?s date|date today|current date|current time|what day is it|what date is it|what time is it|time now)\b/.test(normalized) ||
    /(?:تاريخ اليوم|ماهو تاريخ|ما هو تاريخ|ماهو اليوم|ما هو اليوم|شنو تاريخ|اش تاريخ|شنو نهار|اش نهار|الوقت دابا|شحال فالساعة|كم الساعة)/.test(message)
  );
}

function getLocalDateTimeResponse(message: string) {
  const locale = isArabicLikeMessage(message) ? 'ar-MA' : 'en-GB';
  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Casablanca',
  }).format(new Date());

  return isArabicLikeMessage(message)
    ? `اليوم هو **${formatted}** بتوقيت المغرب.`
    : `Today is **${formatted}** in Morocco time.`;
}

function getLocalCoachResponse(messages: CoachMessage[]) {
  const latest = getLatestUserMessage(messages);
  const lowerLatest = latest.toLowerCase();

  if (isDateOrTimeQuestion(latest)) {
    return getLocalDateTimeResponse(latest);
  }

  if (/chest|bench|push|صدر|بنش|دفع/.test(lowerLatest)) {
    return [
      '**Fallback chest session**',
      '',
      'The external AI provider is unavailable right now, but here is a usable session based on your request.',
      '',
      '**Warm-up**',
      '- 5 minutes light cardio',
      '- Band pull-aparts: 2 x 15',
      '- Push-ups or light chest press: 2 x 10',
      '',
      '**Workout**',
      '- Bench press or chest press machine: 4 x 6-8, rest 2 min',
      '- Incline dumbbell press: 3 x 8-10, rest 90 sec',
      '- Cable fly or pec deck: 3 x 12-15, rest 60-75 sec',
      '- Push-ups: 2 sets near failure, stop before form breaks',
      '',
      '**Progression**',
      '- When you hit the top reps on all sets, add 1-2.5kg next time',
      '- Keep shoulders back, control the lowering, and avoid bouncing reps',
    ].join('\n');
  }

  if (/workout|training|routine|program|plan|split|exercise|gym|strength|muscle|تمرين|برنامج|رياضة/.test(lowerLatest)) {
    return [
      '**Fallback 3-day training plan**',
      '',
      'The external AI provider is unavailable right now, but here is a balanced plan you can use today.',
      '',
      '**Day 1 - Full body strength**',
      '- Squat or leg press: 3 x 6-8, rest 2 min',
      '- Bench press or chest press: 3 x 6-10, rest 2 min',
      '- Seated row or lat pulldown: 3 x 8-12, rest 90 sec',
      '- Plank: 3 x 30-45 sec',
      '',
      '**Day 2 - Muscle builder**',
      '- Romanian deadlift: 3 x 8-10, rest 2 min',
      '- Shoulder press: 3 x 8-10, rest 90 sec',
      '- Cable row or dumbbell row: 3 x 10-12, rest 90 sec',
      '- Biceps curl + triceps pushdown: 2 x 12-15 each',
      '',
      '**Day 3 - Technique and volume**',
      '- Goblet squat or split squat: 3 x 10 each side',
      '- Incline press or push-ups: 3 x 8-12',
      '- Lat pulldown: 3 x 10-12',
      '- Lateral raises: 2 x 15',
      '- Easy cardio: 10-15 minutes',
      '',
      '**Progression**',
      '- Keep 1-2 reps in reserve on most sets',
      '- Add reps first, then add small weight when all sets feel clean',
      '- Take at least one rest day between sessions',
    ].join('\n');
  }

  if (isArabicLikeMessage(latest)) {
    return [
      '**نقدر نعاونك، ولكن AI الخارجي ما جاوبش دابا.**',
      '',
      'باش نعطيك جواب رياضي مفيد، عطيني هاد المعلومات:',
      '- الهدف ديالك: تنشيف، تضخيم، قوة، ولا صحة عامة',
      '- المستوى: مبتدئ، متوسط، ولا متقدم',
      '- شحال من نهار كتقدر تتمرن فالسيمانة',
      '- واش كتتمرن فالجيم ولا فالدار',
      '',
      'إلى بغيتي جواب عام خارج الرياضة، سيفط السؤال مباشرة وغادي نعطيك جواب مختصر وواضح.',
    ].join('\n');
  }

  return [
    '**AI Coach fallback response**',
    '',
    'The external AI provider did not return a response. For a high-quality coaching answer, send:',
    '- Your goal',
    '- Training level',
    '- Available equipment',
    '- Days per week',
    '- Any pain or limitations',
    '',
    'I can still give a basic plan, but production should use `OPENAI_API_KEY` with `OPENAI_AI_COACH_MODEL=gpt-4o` for best results.',
  ].join('\n');
}

function getOpenAiErrorMessage(payload: OpenAIChatCompletionResponse | null, status: number) {
  return payload?.error?.message || `OpenAI request failed with status ${status}`;
}

async function getOpenAiCoachResponse(messages: CoachMessage[]): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logAiCoach('error', 'missing_openai_api_key', getEnvStatus());
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!OPENAI_AI_COACH_MODEL.trim()) {
    logAiCoach('error', 'invalid_openai_model', getEnvStatus());
    throw new Error('OPENAI_AI_COACH_MODEL is empty.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_COACH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${OPENAI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_AI_COACH_MODEL,
        messages: toOpenAiMessages(messages),
        temperature: AI_COACH_TEMPERATURE,
        max_tokens: AI_COACH_MAX_TOKENS,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as OpenAIChatCompletionResponse | null;

    if (!response.ok) {
      logAiCoach('error', 'openai_request_failed', {
        status: response.status,
        model: OPENAI_AI_COACH_MODEL,
        errorType: payload?.error?.type,
        errorCode: payload?.error?.code,
        errorMessage: payload?.error?.message,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(getOpenAiErrorMessage(payload, response.status));
    }

    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      logAiCoach('error', 'openai_empty_response', {
        model: OPENAI_AI_COACH_MODEL,
        responseId: payload?.id,
        durationMs: Date.now() - startedAt,
      });
      throw new Error('OpenAI response did not include text.');
    }

    logAiCoach('info', 'openai_request_succeeded', {
      model: OPENAI_AI_COACH_MODEL,
      durationMs: Date.now() - startedAt,
    });

    return { provider: 'openai', model: OPENAI_AI_COACH_MODEL, response: text };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logAiCoach('error', 'openai_timeout', {
        model: OPENAI_AI_COACH_MODEL,
        timeoutMs: AI_COACH_TIMEOUT_MS,
      });
      throw new Error(`OpenAI request timed out after ${AI_COACH_TIMEOUT_MS}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getGeminiCoachResponse(messages: CoachMessage[]): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    logAiCoach('warn', 'missing_gemini_api_key', getEnvStatus());
    throw new Error('Gemini API key is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_COACH_TIMEOUT_MS);
  const startedAt = Date.now();
  const geminiPayload = toGeminiPayload(messages);

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/models/${GEMINI_AI_COACH_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: geminiPayload.systemInstruction }],
        },
        contents: geminiPayload.contents,
        generationConfig: {
          maxOutputTokens: AI_COACH_MAX_TOKENS,
          temperature: AI_COACH_TEMPERATURE,
          topP: 0.9,
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const errorMessage =
        payload && typeof payload === 'object'
          ? (payload as { error?: { message?: string } }).error?.message
          : undefined;
      logAiCoach('error', 'gemini_request_failed', {
        status: response.status,
        model: GEMINI_AI_COACH_MODEL,
        errorMessage,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(errorMessage || `Gemini request failed with status ${response.status}`);
    }

    const text = extractGeminiText(payload);
    if (!text) {
      logAiCoach('error', 'gemini_empty_response', {
        model: GEMINI_AI_COACH_MODEL,
        durationMs: Date.now() - startedAt,
      });
      throw new Error('Gemini response did not include text.');
    }

    return { provider: 'gemini', model: GEMINI_AI_COACH_MODEL, response: text };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logAiCoach('error', 'gemini_timeout', {
        model: GEMINI_AI_COACH_MODEL,
        timeoutMs: AI_COACH_TIMEOUT_MS,
      });
      throw new Error(`Gemini request timed out after ${AI_COACH_TIMEOUT_MS}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAiCoachResponse(messages: CoachMessage[]): Promise<ProviderResult> {
  logAiCoach('info', 'request_started', getEnvStatus());

  try {
    return await getOpenAiCoachResponse(messages);
  } catch (openAiError) {
    logAiCoach('warn', 'openai_provider_unavailable', {
      message: openAiError instanceof Error ? openAiError.message : 'Unknown OpenAI error',
    });
  }

  try {
    return await getGeminiCoachResponse(messages);
  } catch (geminiError) {
    logAiCoach('warn', 'gemini_provider_unavailable', {
      message: geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error',
    });
  }

  return {
    provider: 'local',
    model: 'local-fallback',
    response: getLocalCoachResponse(messages),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sanitized = sanitizeInput(body) as Record<string, unknown>;
    const result = aiCoachRequestSchema.safeParse(sanitized);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      logAiCoach('warn', 'validation_failed', { errors });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const resultData = await getAiCoachResponse(result.data.messages);

    return NextResponse.json({
      success: true,
      response: resultData.response,
      provider: resultData.provider,
      model: resultData.model,
    });
  } catch (error: unknown) {
    logAiCoach('error', 'unhandled_route_error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: 'AI service temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
