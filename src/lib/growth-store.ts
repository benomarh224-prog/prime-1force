'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HabitCategory = 'Mindset' | 'Health' | 'Learning' | 'Discipline';

export type Habit = {
  id: string;
  title: string;
  category: HabitCategory;
  streak: number;
  completed: boolean;
  color: string;
};

export type Goal = {
  id: string;
  title: string;
  area: string;
  progress: number;
  deadline: string;
};

type GrowthState = {
  habits: Habit[];
  goals: Goal[];
  xp: number;
  level: number;
  coins: number;
  focusMinutes: number;
  journalEntries: number;
  toggleHabit: (id: string) => void;
  addHabit: (title: string, category: HabitCategory) => void;
  updateGoal: (id: string, progress: number) => void;
  addFocusMinutes: (minutes: number) => void;
  addJournalEntry: () => void;
};

const categoryColors: Record<HabitCategory, string> = {
  Mindset: '#60a5fa',
  Health: '#34d399',
  Learning: '#818cf8',
  Discipline: '#38bdf8',
};

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set) => ({
      habits: [
        { id: 'focus', title: '90 min deep work', category: 'Discipline', streak: 12, completed: true, color: '#38bdf8' },
        { id: 'read', title: 'Read 20 pages', category: 'Learning', streak: 8, completed: true, color: '#818cf8' },
        { id: 'move', title: 'Move your body', category: 'Health', streak: 6, completed: false, color: '#34d399' },
        { id: 'reflect', title: 'Evening reflection', category: 'Mindset', streak: 15, completed: false, color: '#60a5fa' },
      ],
      goals: [
        { id: 'product', title: 'Launch my first digital product', area: 'Career', progress: 68, deadline: 'Sep 30' },
        { id: 'books', title: 'Read 24 books this year', area: 'Learning', progress: 54, deadline: 'Dec 31' },
        { id: 'health', title: 'Build an elite health routine', area: 'Health', progress: 76, deadline: 'Oct 15' },
      ],
      xp: 2840,
      level: 12,
      coins: 460,
      focusMinutes: 318,
      journalEntries: 42,
      toggleHabit: (id) => set((state) => {
        const habit = state.habits.find((item) => item.id === id);
        if (!habit) return state;
        const completing = !habit.completed;
        return {
          habits: state.habits.map((item) =>
            item.id === id
              ? { ...item, completed: completing, streak: Math.max(0, item.streak + (completing ? 1 : -1)) }
              : item
          ),
          xp: Math.max(0, state.xp + (completing ? 25 : -25)),
          coins: Math.max(0, state.coins + (completing ? 5 : -5)),
        };
      }),
      addHabit: (title, category) => set((state) => ({
        habits: [...state.habits, {
          id: `habit-${Date.now()}`,
          title,
          category,
          streak: 0,
          completed: false,
          color: categoryColors[category],
        }],
      })),
      updateGoal: (id, progress) => set((state) => ({
        goals: state.goals.map((goal) => goal.id === id ? { ...goal, progress: Math.max(0, Math.min(100, progress)) } : goal),
      })),
      addFocusMinutes: (minutes) => set((state) => ({
        focusMinutes: state.focusMinutes + minutes,
        xp: state.xp + Math.round(minutes / 2),
      })),
      addJournalEntry: () => set((state) => ({
        journalEntries: state.journalEntries + 1,
        xp: state.xp + 15,
      })),
    }),
    { name: 'primeforge-growth' }
  )
);
