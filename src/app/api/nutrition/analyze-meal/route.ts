import { NextResponse } from 'next/server';

type FoodEstimate = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

type NutritionProvider = 'openai' | 'zai-vision' | 'demo-estimate';

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
  provider: NutritionProvider;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

const AI_TIMEOUT_MS = boundedInteger(
  process.env.AI_MEAL_TIMEOUT_MS || process.env.AI_COACH_TIMEOUT_MS,
  30000,
  1000,
  120000
);
const AI_MAX_TOKENS = boundedInteger(process.env.AI_MEAL_MAX_TOKENS, 700, 100, 4000);

function roundMacro(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function clampConfidence(value: unknown) {
  const number = roundMacro(value);
  return Math.min(99, Math.max(1, number));
}

function normalizeAnalysis(input: unknown, provider: NutritionProvider): MealAnalysis | null {
  if (!input || typeof input !== 'object') return null;

  const source = input as {
    foods?: unknown;
    totals?: unknown;
    confidence?: unknown;
    accuracyNote?: unknown;
  };
  const foodsInput = Array.isArray(source.foods) ? source.foods : [];
  const foods = foodsInput
    .map((item): FoodEstimate | null => {
      if (!item || typeof item !== 'object') return null;
      const food = item as Record<string, unknown>;
      const name = typeof food.name === 'string' && food.name.trim() ? food.name.trim().slice(0, 80) : 'Detected food';

      return {
        name,
        servingSize:
          typeof food.servingSize === 'string' && food.servingSize.trim()
            ? food.servingSize.trim().slice(0, 80)
            : 'estimated portion',
        calories: roundMacro(food.calories),
        protein: roundMacro(food.protein),
        carbs: roundMacro(food.carbs),
        fat: roundMacro(food.fat),
        confidence: clampConfidence(food.confidence ?? source.confidence ?? 70),
      };
    })
    .filter((food): food is FoodEstimate => Boolean(food))
    .slice(0, 6);

  if (foods.length === 0) return null;

  const calculatedTotals = foods.reduce(
    (sum, food) => ({
      calories: sum.calories + food.calories,
      protein: sum.protein + food.protein,
      carbs: sum.carbs + food.carbs,
      fat: sum.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const totalsInput = source.totals && typeof source.totals === 'object' ? source.totals as Record<string, unknown> : {};
  const totals = {
    calories: roundMacro(totalsInput.calories ?? calculatedTotals.calories),
    protein: roundMacro(totalsInput.protein ?? calculatedTotals.protein),
    carbs: roundMacro(totalsInput.carbs ?? calculatedTotals.carbs),
    fat: roundMacro(totalsInput.fat ?? calculatedTotals.fat),
  };

  return {
    foods,
    totals,
    confidence: clampConfidence(source.confidence ?? Math.round(foods.reduce((sum, food) => sum + food.confidence, 0) / foods.length)),
    accuracyNote:
      typeof source.accuracyNote === 'string' && source.accuracyNote.trim()
        ? source.accuracyNote.trim().slice(0, 240)
        : 'AI-generated estimate from the uploaded meal photo. Confirm portions for best accuracy.',
    provider,
  };
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not include JSON.');
  }

  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

function getVisionConfig() {
  const openAiKey = process.env.OPENAI_API_KEY;
  const glmKey = process.env.GLM_API_KEY;
  const apiKey = openAiKey || glmKey;
  const baseUrl = (openAiKey ? process.env.OPENAI_BASE_URL : process.env.GLM_API_BASE_URL) || 'https://api.openai.com/v1';
  const model = process.env.AI_MEAL_MODEL || process.env.OPENAI_VISION_MODEL || (openAiKey ? 'gpt-4o-mini' : undefined);

  if (!apiKey || !model) return null;
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ''), model };
}

async function analyzeWithVision(file: File) {
  const config = getVisionConfig();
  if (!config) {
    throw new Error('AI vision is not configured for meal photos yet.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: AI_MAX_TOKENS,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You estimate meal nutrition from photos. Return only valid JSON with foods, totals, confidence, and accuracyNote. Use grams and calories. Be conservative when uncertain.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Analyze this meal photo. Return JSON exactly like {"foods":[{"name":"food","servingSize":"estimated amount","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":70}],"totals":{"calories":0,"protein":0,"carbs":0,"fat":0},"confidence":70,"accuracyNote":"short note"}',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
    cache: 'no-store',
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Vision request failed with status ${response.status}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Vision response was empty.');
  }

  const provider: NutritionProvider = process.env.OPENAI_API_KEY ? 'openai' : 'zai-vision';
  const analysis = normalizeAnalysis(extractJsonObject(content), provider);
  if (!analysis) {
    throw new Error('Vision response could not be converted into a nutrition estimate.');
  }

  return analysis;
}

function createFallbackEstimate(file?: File): MealAnalysis {
  const sizeBoost = file ? Math.min(180, Math.round(file.size / 20000)) : 0;
  const calories = 520 + sizeBoost;
  const protein = 34;
  const carbs = Math.max(35, Math.round((calories * 0.42) / 4));
  const fat = Math.max(12, Math.round((calories * 0.28) / 9));
  const food: FoodEstimate = {
    name: 'Uploaded meal photo',
    servingSize: '1 estimated plate',
    calories,
    protein,
    carbs,
    fat,
    confidence: 45,
  };

  return {
    foods: [food],
    totals: {
      calories,
      protein,
      carbs,
      fat,
    },
    confidence: food.confidence,
    accuracyNote:
      'AI vision could not complete, so this is a conservative placeholder estimate. Edit portions manually if you need precise tracking.',
    provider: 'demo-estimate',
  };
}

async function getUploadedImage(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new Error('Upload a meal photo first.');
  }

  const image = formData.get('image');

  if (!(image instanceof File)) {
    throw new Error('Upload a meal photo first.');
  }

  if (!SUPPORTED_TYPES.has(image.type)) {
    throw new Error('Use a JPEG, PNG, or WebP meal photo.');
  }

  if (image.size === 0) {
    throw new Error('This image is empty. Choose another meal photo.');
  }

  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Upload a photo under 5MB.');
  }

  const header = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a;
  const isWebp =
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50;

  const detectedType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : null;
  if (!detectedType) {
    throw new Error('This file does not appear to be a valid meal photo.');
  }

  return detectedType === image.type
    ? image
    : new File([image], image.name, { type: detectedType, lastModified: image.lastModified });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    fallback: true,
    fallbackReason: 'Upload a meal photo to get a nutrition estimate.',
    analysis: createFallbackEstimate(),
  });
}

export async function POST(request: Request) {
  let image: File | undefined;

  try {
    image = await getUploadedImage(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the uploaded image.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const analysis = await analyzeWithVision(image);
    return NextResponse.json({ success: true, fallback: false, analysis });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'AI vision is unavailable right now.';
    const fallbackReason = detail.includes('not configured')
      ? detail
      : 'AI vision is unavailable right now, so PrimeForge generated a safe estimate.';
    console.warn('[Meal Analyzer] Falling back to local estimate:', detail);

    return NextResponse.json({
      success: true,
      fallback: true,
      fallbackReason,
      analysis: createFallbackEstimate(image),
    });
  }
}
