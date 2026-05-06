'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
