import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildLabPlan, type LabConfig, type LabPlan } from '@/lib/lab';
import type { WorkoutLog } from '@/lib/store';
import type { SplitId } from '@/lib/splits';

export type LabSet = { reps: number; weight: number; done: boolean };
export type LabDraft = { id: string; startedAt: number; plan: LabPlan; sets: Record<string, LabSet[]> };

type LabState = {
  config: LabConfig;
  draft: LabDraft | null;
  history: WorkoutLog[];
  selectedSplit: SplitId;
  selectSplit: (id: SplitId) => void;
  setConfig: (config: Partial<LabConfig>) => void;
  start: (plan?: LabPlan) => void;
  updateSet: (id: string, index: number, patch: Partial<LabSet>) => void;
  cancel: () => void;
  finish: (log: WorkoutLog) => void;
  replaceLog: (localId: string, log: WorkoutLog) => void;
};

export const useLabStore = create<LabState>()(persist((set, get) => ({
  config: { goal: 'strength', minutes: 35, equipment: 'gym' },
  draft: null,
  history: [],
  selectedSplit: 'push',
  selectSplit: selectedSplit => set({ selectedSplit }),
  setConfig: patch => set(state => state.draft ? {} : { config: { ...state.config, ...patch } }),
  start: suppliedPlan => {
    if (get().draft) return;
    const plan = suppliedPlan ?? buildLabPlan(get().config);
    if (suppliedPlan) set({ config: { ...suppliedPlan.config } });
    set({ draft: { id: `lab-${crypto.randomUUID()}`, startedAt: Date.now(), plan, sets: Object.fromEntries(plan.movements.map(movement => [movement.id, Array.from({ length: plan.sets }, () => ({ reps: Number.parseInt(plan.reps), weight: 0, done: false }))])) } });
  },
  updateSet: (id, index, patch) => set(state => {
    if (!state.draft || !state.draft.sets[id]) return {};
    return { draft: { ...state.draft, sets: { ...state.draft.sets, [id]: state.draft.sets[id].map((item, i) => i === index ? { ...item, ...patch } : item) } } };
  }),
  cancel: () => set({ draft: null }),
  finish: log => set(state => ({ draft: null, history: [log, ...state.history.filter(item => item.id !== log.id)] })),
  replaceLog: (localId, log) => set(state => ({ history: state.history.map(item => item.id === localId ? log : item) })),
}), { name: 'primeforge-lab-v1', version: 1, partialize: state => ({ config: state.config, draft: state.draft, history: state.history }) }));
