import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

type FoodEstimate = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

type VisionProvider = 'openai' | 'gemini' | 'openrouter' | 'zai-vision' | 'demo-estimate';

type MealAnalysis = {
  foods: FoodEstimate[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: number;
  accuracyNote: string;
  provider: VisionProvider;
};

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ANALYSIS_PROMPT = [
  'Analyze this meal photo for a premium gym nutrition tracker.',
  'Return only valid JSON with this exact shape:',
  '{ "foods": [{ "name": string, "servingSize": string, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number }], "confidence": number, "accuracyNote": string }.',
  'Estimate realistic serving sizes and macros from the visible food.',
  'If a portion is unclear, be conservative and mention the uncertainty in accuracyNote.',
  'Do not include markdown, prose, or nutrition advice outside the JSON.',
].join(' ');

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function cleanJsonResponse(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || trimmed;
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  return jsonStart >= 0 && jsonEnd > jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
}

function normalizeAnalysis(value: unknown, provider: VisionProvider): MealAnalysis {
  const input = value as Partial<MealAnalysis> & { foods?: Partial<FoodEstimate>[] };
  const foods = Array.isArray(input.foods)
    ? input.foods.slice(0, 8).map((food, index) => ({
        name: typeof food.name === 'string' && food.name.trim() ? food.name.trim() : `Food item ${index + 1}`,
        servingSize:
          typeof food.servingSize === 'string' && food.servingSize.trim() ? food.servingSize.trim() : 'estimated serving',
        calories: Math.round(clamp(food.calories, 0, 2500, 250)),
        protein: Math.round(clamp(food.protein, 0, 250, 15)),
        carbs: Math.round(clamp(food.carbs, 0, 350, 25)),
        fat: Math.round(clamp(food.fat, 0, 200, 10)),
        confidence: Math.round(clamp(food.confidence, 1, 100, 72)),
      }))
    : [];

  if (foods.length === 0) {
    return getDemoAnalysis();
  }

  const totals = foods.reduce(
    (sum, food) => ({
      calories: sum.calories + food.calories,
      protein: sum.protein + food.protein,
      carbs: sum.carbs + food.carbs,
      fat: sum.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods,
    totals,
    confidence: Math.round(clamp(input.confidence, 1, 100, 76)),
    accuracyNote:
      typeof input.accuracyNote === 'string' && input.accuracyNote.trim()
        ? input.accuracyNote.trim()
        : 'Image-based nutrition is an estimate. Weigh ingredients for competition-level accuracy.',
    provider,
  };
}

function parseAnalysis(content: string, provider: VisionProvider) {
  return normalizeAnalysis(JSON.parse(cleanJsonResponse(content)), provider);
}

function getDemoAnalysis(seed = 0): MealAnalysis {
  const demos: Omit<MealAnalysis, 'provider'>[] = [
    {
      foods: [
        { name: 'Grilled chicken breast', servingSize: '150g', calories: 248, protein: 46, carbs: 0, fat: 5, confidence: 72 },
        { name: 'White rice', servingSize: '180g cooked', calories: 234, protein: 5, carbs: 51, fat: 1, confidence: 66 },
        { name: 'Mixed vegetables', servingSize: '120g', calories: 55, protein: 3, carbs: 10, fat: 1, confidence: 61 },
      ],
      totals: { calories: 537, protein: 54, carbs: 61, fat: 7 },
      confidence: 66,
      accuracyNote:
        'Demo estimate because no AI vision provider is configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY for real analysis.',
    },
    {
      foods: [
        { name: 'Egg omelet', servingSize: '3 eggs', calories: 235, protein: 19, carbs: 2, fat: 16, confidence: 69 },
        { name: 'Whole wheat toast', servingSize: '2 slices', calories: 160, protein: 8, carbs: 28, fat: 2, confidence: 64 },
        { name: 'Avocado', servingSize: '70g', calories: 112, protein: 1, carbs: 6, fat: 11, confidence: 58 },
      ],
      totals: { calories: 507, protein: 28, carbs: 36, fat: 29 },
      confidence: 64,
      accuracyNote:
        'Demo estimate because no AI vision provider is configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY for real analysis.',
    },
    {
      foods: [
        { name: 'Greek yogurt bowl', servingSize: '250g', calories: 160, protein: 25, carbs: 9, fat: 1, confidence: 70 },
        { name: 'Granola', servingSize: '45g', calories: 203, protein: 5, carbs: 33, fat: 7, confidence: 62 },
        { name: 'Berries', servingSize: '100g', calories: 57, protein: 1, carbs: 14, fat: 0, confidence: 68 },
      ],
      totals: { calories: 420, protein: 31, carbs: 56, fat: 8 },
      confidence: 65,
      accuracyNote:
        'Demo estimate because no AI vision provider is configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY for real analysis.',
    },
  ];

  return { ...demos[Math.abs(seed) % demos.length], provider: 'demo-estimate' };
}

async function analyzeWithOpenAI(dataUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_VISION_MODEL || process.env.AI_VISION_MODEL || 'gpt-4o-mini';
  return analyzeWithOpenAICompatible({
    url: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    apiKey,
    model,
    provider: 'openai',
    dataUrl,
    extraHeaders: process.env.OPENAI_ORG_ID ? { 'OpenAI-Organization': process.env.OPENAI_ORG_ID } : undefined,
  });
}

async function analyzeWithOpenRouter(dataUrl: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_VISION_MODEL || process.env.AI_VISION_MODEL || 'google/gemini-2.0-flash-001';
  return analyzeWithOpenAICompatible({
    url: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    model,
    provider: 'openrouter',
    dataUrl,
    extraHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://primeforge.fit',
      'X-Title': 'PrimeForge.fit',
    },
  });
}

async function analyzeWithOpenAICompatible({
  url,
  apiKey,
  model,
  provider,
  dataUrl,
  extraHeaders,
}: {
  url: string;
  apiKey: string;
  model: string;
  provider: 'openai' | 'openrouter';
  dataUrl: string;
  extraHeaders?: Record<string, string>;
}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 900,
    }),
  });

  const payload = (await response.json()) as OpenAICompatibleResponse;
  if (!response.ok) throw new Error(payload.error?.message || `${provider} vision request failed`);

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider} vision response was empty`);
  return parseAnalysis(content, provider);
}

async function analyzeWithGemini(buffer: Buffer, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_VISION_MODEL || process.env.AI_VISION_MODEL || 'gemini-1.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: ANALYSIS_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) throw new Error(payload.error?.message || 'Gemini vision request failed');

  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n');
  if (!content) throw new Error('Gemini vision response was empty');
  return parseAnalysis(content, 'gemini');
}

async function analyzeWithZAI(dataUrl: string) {
  const zai = await getZAI();
  const response = await zai.chat.completions.createVision({
    model: process.env.ZAI_VISION_MODEL || process.env.AI_VISION_MODEL || 'glm-4v',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('ZAI vision response was empty');
  return parseAnalysis(content, 'zai-vision');
}

async function analyzeMealImage(buffer: Buffer, mimeType: string) {
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
  const attempts = [
    () => analyzeWithOpenAI(dataUrl),
    () => analyzeWithGemini(buffer, mimeType),
    () => analyzeWithOpenRouter(dataUrl),
    () => analyzeWithZAI(dataUrl),
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const analysis = await attempt();
      if (analysis) return analysis;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown provider error');
    }
  }

  if (errors.length > 0) {
    console.warn('[Meal Analysis] Using demo estimate:', errors.join(' | '));
  }
  return getDemoAnalysis(buffer.length);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Upload a meal image to analyze.' }, { status: 400 });
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Use a JPEG, PNG, or WebP image.' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ success: false, error: 'Image is too large. Upload an image under 5MB.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzeMealImage(buffer, file.type);

    return NextResponse.json({
      success: true,
      fallback: analysis.provider === 'demo-estimate',
      analysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not analyze meal image';
    if (message.includes('multipart/form-data') || message.includes('application/x-www-form-urlencoded')) {
      return NextResponse.json({ success: false, error: 'Upload a meal image using the scanner form.' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
