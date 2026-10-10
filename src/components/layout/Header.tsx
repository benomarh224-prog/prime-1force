'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { ForgeBrand } from '@/components/forge/ForgeBrand';
import { authDialogEventName, openAuthDialog, type AuthDialogMode } from '@/lib/auth-dialog';
import { useAppStore } from '@/lib/store';

export function Header() {
  const { currentPage, navigate } = useAppStore();
  const { status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthDialogMode>('login');
  useEffect(() => {
    const onAuth = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: AuthDialogMode }>).detail?.mode;
      setAuthMode(mode === 'signup' ? 'signup' : 'login');
      setAuthOpen(true);
    };
    window.addEventListener(authDialogEventName, onAuth);
    return () => window.removeEventListener(authDialogEventName, onAuth);
  }, []);
  return <>
    <a href="#main-content" className="lab-skip-link">Skip to content</a>
    <header className="lab-header"><div className="lab-header-inner">
      <button onClick={() => navigate('home')} aria-label="PrimeForge training lab"><ForgeBrand /></button>
      <nav className="lab-nav" aria-label="Main navigation">
        <button onClick={() => navigate('home')} aria-current={currentPage !== 'dashboard' ? 'page' : undefined}>Training lab</button>
        <button onClick={() => navigate('dashboard')} aria-current={currentPage === 'dashboard' ? 'page' : undefined}>My progress</button>
      </nav>
      {status === 'authenticated' ? <button className="lab-account" onClick={() => signOut({ redirect: false })}>Sign out</button> : <button className="lab-account" onClick={() => openAuthDialog('login')}>Sign in</button>}
    </div></header>
    <AuthDialog open={authOpen} defaultMode={authMode} onOpenChange={setAuthOpen} />
  </>;
}
