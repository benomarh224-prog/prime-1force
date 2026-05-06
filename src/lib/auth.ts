import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ensureAuthSchema } from '@/lib/auth-schema';
import { verifyFallbackUser } from '@/lib/auth-users';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'prime-forge-development-auth-secret-change-before-production';

function toSessionUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.avatar || null,
  };
}

async function authorizeFallback(email: string, password: string) {
  const fallbackUser = await verifyFallbackUser(email, password);
  return fallbackUser ? toSessionUser(fallbackUser) : null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase();

        try {
          await ensureAuthSchema();

          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            const fallbackUser = await authorizeFallback(email, credentials.password);
            if (fallbackUser) return fallbackUser;
            throw new Error('Invalid email or password');
          }

          if (!user.passwordHash) {
            throw new Error('This account needs a password reset before signing in');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          return toSessionUser(user);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          if (
            message === 'Invalid email or password' ||
            message === 'This account needs a password reset before signing in'
          ) {
            throw error;
          }

          console.error('[Auth] Primary database failed:', message);
          const fallbackUser = await authorizeFallback(email, credentials.password);
          if (fallbackUser) return fallbackUser;

          throw new Error('Invalid email or password');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Uses the SPA routing
  },
  secret: authSecret,
  debug: process.env.NODE_ENV === 'development',
};
