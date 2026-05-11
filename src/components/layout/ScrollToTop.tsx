'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export function ScrollToTop() {
  const pathname = usePathname();
  const currentPage = useAppStore((state) => state.currentPage);
  const selectedExerciseId = useAppStore((state) => state.selectedExerciseId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, currentPage, selectedExerciseId]);

  return null;
}
