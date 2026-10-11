'use client';

import { useEffect, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useAppStore, type WorkoutLog } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

type DashboardResponse = {
  success: boolean;
  error?: string;
  profile?: {
    name?: string;
    avatar?: string;
    weight?: number;
    height?: number;
    goal?: string;
    level?: string;
    weeklyGoal?: number;
  };
  workoutLogs?: WorkoutLog[];
};

function AuthenticatedProfileSync() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const syncedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      syncedUserRef.current = null;
      return;
    }

    const userKey =
      (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.email ||
      'authenticated';

    if (syncedUserRef.current === userKey) return;
    syncedUserRef.current = userKey;

    const controller = new AbortController();

    fetch('/api/dashboard', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as DashboardResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Could not load account profile');
        }

        const store = useAppStore.getState();
        if (data.profile) store.setUserProfile(data.profile);
        if (data.workoutLogs) store.setWorkoutLogs(data.workoutLogs);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        syncedUserRef.current = null;
        toast({
          title: 'Could not sync profile',
          description: error instanceof Error ? error.message : 'Your saved account data could not be loaded.',
          variant: 'destructive',
        });
      });

    return () => controller.abort();
  }, [session?.user, status, toast]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
        <AuthenticatedProfileSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
