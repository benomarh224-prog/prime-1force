'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, UserRound } from 'lucide-react';
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
      <button onClick={() => navigate('home')} aria-label="Prime Forge home"><ForgeBrand /></button>
      <nav className="lab-nav" aria-label="Main navigation">
        <button onClick={() => navigate('home')} aria-current={currentPage === 'home' ? 'page' : undefined}>Home</button>
        <button onClick={() => navigate('workouts')} aria-current={currentPage === 'workouts' ? 'page' : undefined}>Workouts</button>
        <button onClick={() => navigate('programs')} aria-current={currentPage === 'programs' ? 'page' : undefined}>Programs</button>
        <button onClick={() => navigate('ai-coach')} aria-current={currentPage === 'ai-coach' ? 'page' : undefined}>AI Coach</button>
      </nav>
      <div className="ref-header-actions"><button className="ref-account-icon" aria-label="My progress" title="My progress" onClick={() => navigate('dashboard')}><UserRound size={18} /></button><button className="ref-button ref-header-start" onClick={() => navigate('workouts')}>Get Started <ArrowRight size={17} /></button>{status === 'authenticated' ? <button className="ref-signin" onClick={() => signOut({ redirect: false })}>Sign out</button> : <button className="ref-signin" onClick={() => openAuthDialog('login')}>Sign in</button>}</div>
    </div></header>
    <AuthDialog open={authOpen} defaultMode={authMode} onOpenChange={setAuthOpen} />
  </>;
}
