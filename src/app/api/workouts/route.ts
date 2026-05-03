import { NextResponse } from 'next/server';
import { exercises } from '@/lib/data';

export async function GET() {
  try {
    // Return sanitized exercise data — strip any potential PII
    const safeExercises = exercises.map(({ id, name, description, category, difficulty, muscleGroup, equipment, duration, calories, image, steps, tips }) => ({
      id,
      name,
      description,
      category,
      difficulty,
      muscleGroup,
      equipment,
      duration,
      calories,
      image,
      steps,
      tips,
    }));

    return NextResponse.json({
      success: true,
      exercises: safeExercises,
      total: safeExercises.length,
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Workouts] Error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { success: false, error: 'Unable to load exercises' },
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
