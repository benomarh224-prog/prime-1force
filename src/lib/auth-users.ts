import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { dirname, resolve } from 'path';
import { tmpdir } from 'os';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  passwordHash: string | null;
  createdAt: string;
}

interface CreateAuthUserInput {
  email: string;
  name: string;
  password: string;
}

const fallbackStorePath =
  process.env.AUTH_FALLBACK_STORE ||
  (process.env.NODE_ENV === 'production'
    ? resolve(tmpdir(), 'prime-forge-auth-users.json')
    : resolve(process.cwd(), 'db', 'auth-users.json'));

let usersCache: AuthUser[] | null = null;
let writeQueue = Promise.resolve();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readFallbackUsers() {
  if (usersCache) return usersCache;

  try {
    const contents = await readFile(fallbackStorePath, 'utf8');
    const parsed = JSON.parse(contents);
    usersCache = Array.isArray(parsed) ? parsed : [];
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
    if (code !== 'ENOENT') throw error;
    usersCache = [];
  }

  return usersCache;
}

async function writeFallbackUsers(users: AuthUser[]) {
  usersCache = users;
  writeQueue = writeQueue.then(async () => {
    await mkdir(dirname(fallbackStorePath), { recursive: true });
    await writeFile(fallbackStorePath, JSON.stringify(users, null, 2), 'utf8');
  });

  return writeQueue;
}

export async function findFallbackUser(email: string) {
  const users = await readFallbackUsers();
  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => user.email === normalizedEmail) || null;
}

export async function createFallbackUser(input: CreateAuthUserInput) {
  const users = await readFallbackUsers();
  const email = normalizeEmail(input.email);

  if (users.some((user) => user.email === email)) {
    return { user: null, alreadyExists: true };
  }

  const user: AuthUser = {
    id: randomUUID(),
    email,
    name: input.name.trim(),
    role: 'user',
    avatar: null,
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: new Date().toISOString(),
  };

  await writeFallbackUsers([...users, user]);
  return { user, alreadyExists: false };
}

export async function verifyFallbackUser(email: string, password: string) {
  const user = await findFallbackUser(email);

  if (!user?.passwordHash) return null;

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  return isPasswordValid ? user : null;
}
