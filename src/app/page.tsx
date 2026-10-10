'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/components/pages/HomePage';
import { ForgeProgressPage } from '@/components/forge/ForgeProgressPage';

export default function MainApp() {
  const currentPage = useAppStore(state => state.currentPage);
  const navigate = useAppStore(state => state.navigate);
  useEffect(() => {
    const applyRoute = () => {
      const hash = window.location.hash.slice(1);
      navigate(hash === 'dashboard' || hash === 'progress' ? 'dashboard' : 'home');
    };
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, [navigate]);
  return <div className="flex min-h-screen min-w-0 flex-col">
    <Header />
    <main id="main-content" className="min-w-0 flex-1">{currentPage === 'dashboard' ? <ForgeProgressPage /> : <HomePage />}</main>
    <Footer />
  </div>;
}
