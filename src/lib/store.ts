import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PageName = 'home' | 'workouts' | 'exercise-detail' | 'schedule' | 'ai-coach' | 'dashboard' | 'nutrition' | 'contact';

// ─── Workout Log Types ──────────────────────────────────────────

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  duration: number; // minutes
  notes: string;
  completed?: boolean;
}

// ─── App State ──────────────────────────────────────────────────

interface AppState {
  currentPage: PageName;
  selectedExerciseId: string | null;
  sidebarOpen: boolean;
  favorites: string[];
  // User profile
  userName: string;
  userAvatar: string;
  userWeight: number;
  userHeight: number;
  userGoal: string;
  userLevel: string;
  weeklyGoal: number;
  // Workout logs
  workoutLogs: WorkoutLog[];
  // Actions
  navigate: (page: PageName) => void;
  setExerciseId: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFavorite: (exerciseId: string) => void;
  setUserProfile: (data: {
    name?: string;
    avatar?: string;
    weight?: number;
    height?: number;
    goal?: string;
    level?: string;
    weeklyGoal?: number;
  }) => void;
  setWorkoutLogs: (logs: WorkoutLog[]) => void;
  upsertWorkoutLog: (log: WorkoutLog) => void;
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
  completeWorkoutLog: (id: string, completed?: boolean) => void;
  deleteWorkoutLog: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'home',
      selectedExerciseId: null,
      sidebarOpen: false,
      favorites: [],
      userName: '',
      userAvatar: '',
      userWeight: 75,
      userHeight: 175,
      userGoal: 'lose_weight',
      userLevel: 'intermediate',
      weeklyGoal: 5,
      workoutLogs: [],
      navigate: (page) => {
        if (typeof window !== 'undefined') {
          const nextUrl = page === 'home' ? window.location.pathname : `${window.location.pathname}#${page}`;
          window.history.replaceState(null, '', nextUrl);
        }
        set({ currentPage: page });
      },
      setExerciseId: (id) => set({ selectedExerciseId: id, currentPage: 'exercise-detail' }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleFavorite: (exerciseId) => set((s) => ({
        favorites: s.favorites.includes(exerciseId)
          ? s.favorites.filter((id) => id !== exerciseId)
          : [...s.favorites, exerciseId]
      })),
      setUserProfile: (data) => set({
        ...(data.name !== undefined && { userName: data.name }),
        ...(data.avatar !== undefined && { userAvatar: data.avatar }),
        ...(data.weight !== undefined && { userWeight: data.weight }),
        ...(data.height !== undefined && { userHeight: data.height }),
        ...(data.goal !== undefined && { userGoal: data.goal }),
        ...(data.level !== undefined && { userLevel: data.level }),
        ...(data.weeklyGoal !== undefined && { weeklyGoal: data.weeklyGoal }),
      }),
      setWorkoutLogs: (logs) => set({ workoutLogs: logs }),
      upsertWorkoutLog: (log) => set((s) => ({
        workoutLogs: s.workoutLogs.some((item) => item.id === log.id)
          ? s.workoutLogs.map((item) => (item.id === log.id ? log : item))
          : [log, ...s.workoutLogs],
      })),
      addWorkoutLog: (log) => set((s) => ({
        workoutLogs: [
          { ...log, id: `wl-${Date.now()}` },
          ...s.workoutLogs,
        ],
      })),
      completeWorkoutLog: (id, completed = true) => set((s) => ({
        workoutLogs: s.workoutLogs.map((log) =>
          log.id === id ? { ...log, completed } : log
        ),
      })),
      deleteWorkoutLog: (id) => set((s) => ({
        workoutLogs: s.workoutLogs.filter((l) => l.id !== id),
      })),
    }),
    {
      name: 'primeforge-profile',
      partialize: (state) => ({
        userName: state.userName,
        userAvatar: state.userAvatar,
        userWeight: state.userWeight,
        userHeight: state.userHeight,
        userGoal: state.userGoal,
        userLevel: state.userLevel,
        weeklyGoal: state.weeklyGoal,
        favorites: state.favorites,
        workoutLogs: state.workoutLogs,
      }),
    }
  )
);
