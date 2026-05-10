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
  provider: 'zai-vision' | 'demo-estimate';
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function normalizeAnalysis(value: unknown): MealAnalysis {
  const input = value as Partial<MealAnalysis> & { foods?: Partial<FoodEstimate>[] };
  const foods = Array.isArray(input.foods)
    ? input.foods.slice(0, 8).map((food, index) => ({
        name: typeof food.name === 'string' && food.name.trim() ? food.name.trim() : `Food item ${index + 1}`,
        servingSize: typeof food.servingSize === 'string' && food.servingSize.trim() ? food.servingSize.trim() : 'estimated serving',
        calories: Math.round(clamp(food.calories, 0, 2500, 250)),
        protein: Math.round(clamp(food.protein, 0, 250, 15)),
        carbs: Math.round(clamp(food.carbs, 0, 350, 25)),
        fat: Math.round(clamp(food.fat, 0, 200, 10)),
        confidence: Math.round(clamp(food.confidence, 1, 100, 72)),
      }))
    : [];

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
    foods: foods.length > 0 ? foods : getDemoAnalysis().foods,
    totals: foods.length > 0 ? totals : getDemoAnalysis().totals,
    confidence: Math.round(clamp(input.confidence, 1, 100, foods.length > 0 ? 76 : 58)),
    accuracyNote:
      typeof input.accuracyNote === 'string' && input.accuracyNote.trim()
        ? input.accuracyNote.trim()
        : 'Image-based nutrition is an estimate. Weigh ingredients for competition-level accuracy.',
    provider: 'zai-vision',
  };
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
      accuracyNote: 'Demo estimate because the AI vision provider is unavailable. Portion sizes are approximate.',
    },
    {
      foods: [
        { name: 'Egg omelet', servingSize: '3 eggs', calories: 235, protein: 19, carbs: 2, fat: 16, confidence: 69 },
        { name: 'Whole wheat toast', servingSize: '2 slices', calories: 160, protein: 8, carbs: 28, fat: 2, confidence: 64 },
        { name: 'Avocado', servingSize: '70g', calories: 112, protein: 1, carbs: 6, fat: 11, confidence: 58 },
      ],
      totals: { calories: 507, protein: 28, carbs: 36, fat: 29 },
      confidence: 64,
      accuracyNote: 'Demo estimate because the AI vision provider is unavailable. Use grams for tighter tracking.',
    },
    {
      foods: [
        { name: 'Greek yogurt bowl', servingSize: '250g', calories: 160, protein: 25, carbs: 9, fat: 1, confidence: 70 },
        { name: 'Granola', servingSize: '45g', calories: 203, protein: 5, carbs: 33, fat: 7, confidence: 62 },
        { name: 'Berries', servingSize: '100g', calories: 57, protein: 1, carbs: 14, fat: 0, confidence: 68 },
      ],
      totals: { calories: 420, protein: 31, carbs: 56, fat: 8 },
      confidence: 65,
      accuracyNote: 'Demo estimate because the AI vision provider is unavailable. Sauces and toppings can change totals.',
    },
  ];

  return { ...demos[Math.abs(seed) % demos.length], provider: 'demo-estimate' };
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
    const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

    try {
      const zai = await getZAI();
      const prompt = [
        'Analyze this meal photo for a gym nutrition tracker.',
        'Return only valid JSON with this shape:',
        '{ "foods": [{ "name": string, "servingSize": string, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number }], "confidence": number, "accuracyNote": string }.',
        'Estimate realistic serving sizes and macros. If uncertain, be conservative and explain uncertainty in accuracyNote.',
      ].join(' ');

      const response = await zai.chat.completions.createVision({
        model: process.env.AI_VISION_MODEL || 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Vision response was empty');

      const analysis = normalizeAnalysis(JSON.parse(cleanJsonResponse(content)));
      return NextResponse.json({ success: true, analysis });
    } catch (error) {
      console.warn('[Meal Analysis] Using demo estimate:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({
        success: true,
        fallback: true,
        analysis: getDemoAnalysis(buffer.length),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not analyze meal image';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
