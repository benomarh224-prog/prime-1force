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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`;

function isExpectedColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('duplicate column name') ||
    message.includes('already exists')
  );
}

export function ensureAuthSchema() {
  schemaReady ??= (async () => {
    await db.$executeRawUnsafe(createUserTableSql);

    try {
      await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT');
    } catch (error: unknown) {
      if (!isExpectedColumnError(error)) throw error;
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
