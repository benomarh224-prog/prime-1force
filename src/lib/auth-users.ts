import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { dirname, resolve } from 'path';
import { tmpdir } from 'os';
import bcrypt from 'bcryptjs';

export interface StoredWorkoutLog {
  id: string;
  date: string;
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: { reps: number; weight: number }[];
  }[];
  duration: number;
  notes: string;
  completed?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  passwordHash: string | null;
  createdAt: string;
  weight?: number | null;
  height?: number | null;
  goal?: string | null;
  level?: string | null;
  weeklyGoal?: number | null;
  workoutLogs?: StoredWorkoutLog[];
}

interface CreateAuthUserInput {
  email: string;
  name: string;
  password: string;
}

interface FallbackSessionUserInput {
  id: string;
  email: string;
  name?: string | null;
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

export async function findFallbackUserById(id: string) {
  const users = await readFallbackUsers();
  return users.find((user) => user.id === id) || null;
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
    weight: 75,
    height: 175,
    goal: 'lose_weight',
    level: 'intermediate',
    weeklyGoal: 5,
    workoutLogs: [],
  };

  await writeFallbackUsers([...users, user]);
  return { user, alreadyExists: false };
}

export async function ensureFallbackSessionUser(input: FallbackSessionUserInput) {
  const users = await readFallbackUsers();
  const email = normalizeEmail(input.email);
  const existingIndex = users.findIndex((user) => user.id === input.id || user.email === email);

  if (existingIndex !== -1) {
    const existing = users[existingIndex];
    const nextUser = {
      ...existing,
      id: existing.id || input.id,
      email,
      name: existing.name || input.name || email.split('@')[0],
    };
    const nextUsers = [...users];
    nextUsers[existingIndex] = nextUser;
    await writeFallbackUsers(nextUsers);
    return nextUser;
  }

  const user: AuthUser = {
    id: input.id,
    email,
    name: input.name || email.split('@')[0],
    role: 'user',
    avatar: null,
    passwordHash: null,
    createdAt: new Date().toISOString(),
    weight: 75,
    height: 175,
    goal: 'lose_weight',
    level: 'intermediate',
    weeklyGoal: 5,
    workoutLogs: [],
  };

  await writeFallbackUsers([...users, user]);
  return user;
}

export async function verifyFallbackUser(email: string, password: string) {
  const user = await findFallbackUser(email);

  if (!user?.passwordHash) return null;

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  return isPasswordValid ? user : null;
}

export async function updateFallbackUser(
  id: string,
  patch: Partial<Pick<AuthUser, 'name' | 'avatar' | 'weight' | 'height' | 'goal' | 'level' | 'weeklyGoal' | 'workoutLogs'>>
) {
  const users = await readFallbackUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) return null;

  const nextUser = { ...users[index], ...patch };
  const nextUsers = [...users];
  nextUsers[index] = nextUser;
  await writeFallbackUsers(nextUsers);
  return nextUser;
}
