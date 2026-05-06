import { db } from '@/lib/db';

let schemaReady: Promise<void> | null = null;

export function ensureAuthSchema() {
  schemaReady ??= db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT')
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes('duplicate column name') ||
        message.includes('already exists')
      ) {
        return;
      }

      throw error;
    })
    .then(() => undefined);

  return schemaReady;
}
