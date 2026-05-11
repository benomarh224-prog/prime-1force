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

type NutritionProvider = 'open-food-facts';

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

type OpenFoodFactsProduct = {
  brands?: string;
  generic_name?: string;
  nutriments?: Record<string, unknown>;
  product_name?: string;
  product_name_en?: string;
  serving_size?: string;
};

type OpenFoodFactsResponse = {
  product?: OpenFoodFactsProduct;
  status?: number;
  status_verbose?: string;
};

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product/737628064502.json';

function toNumber(value: unknown) {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

function roundMacro(value: number | null) {
  return Math.max(0, Math.round(value ?? 0));
}

function readNutriment(nutriments: Record<string, unknown>, servingKey: string, per100gKey: string) {
  return toNumber(nutriments[servingKey]) ?? toNumber(nutriments[per100gKey]);
}

function readCalories(nutriments: Record<string, unknown>) {
  const kcal = readNutriment(nutriments, 'energy-kcal_serving', 'energy-kcal_100g');
  if (kcal !== null) return kcal;

  const kilojoules = readNutriment(nutriments, 'energy-kj_serving', 'energy-kj_100g');
  return kilojoules === null ? null : kilojoules / 4.184;
}

function productName(product: OpenFoodFactsProduct) {
  return (
    product.product_name_en?.trim() ||
    product.product_name?.trim() ||
    product.generic_name?.trim() ||
    product.brands?.trim() ||
    'Open Food Facts product'
  );
}

function normalizeOpenFoodFactsProduct(product: OpenFoodFactsProduct): MealAnalysis {
  const nutriments = product.nutriments ?? {};
  const food: FoodEstimate = {
    name: productName(product),
    servingSize: product.serving_size?.trim() || 'per 100g',
    calories: roundMacro(readCalories(nutriments)),
    protein: roundMacro(readNutriment(nutriments, 'proteins_serving', 'proteins_100g')),
    carbs: roundMacro(readNutriment(nutriments, 'carbohydrates_serving', 'carbohydrates_100g')),
    fat: roundMacro(readNutriment(nutriments, 'fat_serving', 'fat_100g')),
    confidence: 96,
  };

  return {
    foods: [food],
    totals: {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    },
    confidence: food.confidence,
    accuracyNote:
      'Nutrition data loaded from Open Food Facts for barcode 737628064502. Values use serving data when available, otherwise per-100g data.',
    provider: 'open-food-facts',
  };
}

async function analyzeMealFromOpenFoodFacts() {
  const response = await fetch(OPEN_FOOD_FACTS_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;
  if (payload.status === 0 || !payload.product) {
    throw new Error(payload.status_verbose || 'Open Food Facts product was not found.');
  }

  return normalizeOpenFoodFactsProduct(payload.product);
}

export async function GET() {
  try {
    const analysis = await analyzeMealFromOpenFoodFacts();
    return NextResponse.json({ success: true, fallback: false, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not analyze meal.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
