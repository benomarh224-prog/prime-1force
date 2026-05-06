import { db } from '@/lib/db';

let schemaReady: Promise<void> | null = null;

const createUserTableSql = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT,
  "avatar" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "emailVerified" DATETIME,
  "weight" REAL,
  "height" REAL,
  "goal" TEXT DEFAULT 'lose_weight',
  "level" TEXT DEFAULT 'beginner',
  "weeklyGoal" INTEGER DEFAULT 5,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`;

async function columnExists(table: string, column: string) {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
  return rows.some((row) => row.name === column);
}

export function ensureAuthSchema() {
  schemaReady ??= (async () => {
    await db.$executeRawUnsafe(createUserTableSql);

    if (!(await columnExists('User', 'passwordHash'))) {
      await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT');
    }

    try {
      await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")');
    } catch (error: unknown) {
      console.warn(
        '[Auth Schema] Could not create unique email index:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  })();

  return schemaReady;
}
