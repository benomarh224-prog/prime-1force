'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/components/pages/HomePage';
import { WorkoutsPage } from '@/components/pages/WorkoutsPage';
import { ExerciseDetailPage } from '@/components/pages/ExerciseDetailPage';
import { AICoachPage } from '@/components/pages/AICoachPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { NutritionPage } from '@/components/pages/NutritionPage';
import { ContactPage } from '@/components/pages/ContactPage';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function MainApp() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'exercise-detail':
        return <ExerciseDetailPage />;
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
