import { PrismaClient } from '@prisma/client';
import { mkdirSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function ensureSqliteDirectory() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.startsWith('file:')) return;

  const sqlitePath = databaseUrl.slice('file:'.length).split('?')[0];
  if (!sqlitePath || sqlitePath === ':memory:') return;

  const schemaDir = resolve(process.cwd(), 'prisma');
  const absolutePath = isAbsolute(sqlitePath)
    ? sqlitePath
    : resolve(schemaDir, sqlitePath);

  mkdirSync(dirname(absolutePath), { recursive: true });
}

ensureSqliteDirectory();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log queries in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
