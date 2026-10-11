'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/components/pages/HomePage';
import { ForgeProgressPage } from '@/components/forge/ForgeProgressPage';
import { ReferencePrograms } from '@/components/forge/ReferencePrograms';

const TrainingLab = dynamic(() => import('@/components/forge/TrainingLab').then(module => module.TrainingLab), { loading: () => <p className="ref-loading">Loading your training space…</p> });
const AICoachPage = dynamic(() => import('@/components/pages/AICoachPage').then(module => module.AICoachPage), { loading: () => <p className="ref-loading">Loading your coach…</p> });

export default function MainApp() {
  const currentPage = useAppStore(state => state.currentPage);
  const navigate = useAppStore(state => state.navigate);
  useEffect(() => {
    const applyRoute = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'dashboard' || hash === 'progress') navigate('dashboard');
      else if (hash === 'workouts' || hash === 'lab') navigate('workouts');
      else if (hash === 'programs') navigate('programs');
      else if (hash === 'ai-coach') navigate('ai-coach');
      else navigate('home');
    };
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, [navigate]);
  return <div className="flex min-h-screen min-w-0 flex-col">
    <Header />
    <main id="main-content" className="min-w-0 flex-1">{currentPage === 'dashboard' ? <ForgeProgressPage /> : currentPage === 'workouts' ? <TrainingLab /> : currentPage === 'programs' ? <ReferencePrograms /> : currentPage === 'ai-coach' ? <AICoachPage /> : <HomePage />}</main>
    <Footer />
  </div>;
}
