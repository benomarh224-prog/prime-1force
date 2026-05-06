import { ensureAuthSchema } from '@/lib/auth-schema';
import { db } from '@/lib/db';

async function columnExists(table: string, column: string) {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
  return rows.some((row) => row.name === column);
}

async function addColumnIfMissing(table: string, column: string, sql: string) {
  if (!(await columnExists(table, column))) {
    await db.$executeRawUnsafe(sql);
  }
}

let dashboardSchemaReady: Promise<void> | null = null;

export function ensureDashboardSchema() {
  dashboardSchemaReady ??= (async () => {
    await ensureAuthSchema();
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorkoutSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "workoutId" TEXT,
        "name" TEXT NOT NULL DEFAULT 'Workout',
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "duration" INTEGER,
        "calories" INTEGER,
        "notes" TEXT,
        "exercises" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await addColumnIfMissing('User', 'weeklyGoal', 'ALTER TABLE "User" ADD COLUMN "weeklyGoal" INTEGER DEFAULT 5');
    await addColumnIfMissing('WorkoutSession', 'name', 'ALTER TABLE "WorkoutSession" ADD COLUMN "name" TEXT NOT NULL DEFAULT \'Workout\'');
    await addColumnIfMissing('WorkoutSession', 'exercises', 'ALTER TABLE "WorkoutSession" ADD COLUMN "exercises" TEXT');
    await addColumnIfMissing('WorkoutSession', 'completed', 'ALTER TABLE "WorkoutSession" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false');
  })();

  return dashboardSchemaReady;
}
