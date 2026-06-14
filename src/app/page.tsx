'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageName, useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { HomePage } from '@/components/pages/HomePage';
import { WorkoutsPage } from '@/components/pages/WorkoutsPage';
import { ExerciseDetailPage } from '@/components/pages/ExerciseDetailPage';
import { SchedulePage } from '@/components/pages/SchedulePage';
import { AICoachPage } from '@/components/pages/AICoachPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { NutritionPage } from '@/components/pages/NutritionPage';
import { ContactPage } from '@/components/pages/ContactPage';

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const hashPages: PageName[] = ['home', 'workouts', 'exercise-detail', 'schedule', 'ai-coach', 'dashboard', 'nutrition', 'contact'];

function getPageFromHash(): PageName | null {
  const hash = window.location.hash.replace('#', '') as PageName;
  return hashPages.includes(hash) ? hash : null;
}

export default function MainApp() {
  const { currentPage, navigate } = useAppStore();

  useEffect(() => {
    const applyHashRoute = () => {
      const hashPage = getPageFromHash();
      if (hashPage) navigate(hashPage);
    };

    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);
    return () => window.removeEventListener('hashchange', applyHashRoute);
  }, [navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'exercise-detail':
        return <ExerciseDetailPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'ai-coach':
        return <AICoachPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'nutrition':
        return <NutritionPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-[calc(6.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial={false}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
