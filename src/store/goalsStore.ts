import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SmokingCessationGoal, DietGoal } from '../types/goals'

interface GoalsState {
  smokingGoal: SmokingCessationGoal | null
  dietGoal: DietGoal | null
  setSmokingGoal: (g: SmokingCessationGoal) => void
  clearSmokingGoal: () => void
  setDietGoal: (g: DietGoal) => void
  clearDietGoal: () => void
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      smokingGoal: null,
      dietGoal: null,
      setSmokingGoal: (g) => set({ smokingGoal: g }),
      clearSmokingGoal: () => set({ smokingGoal: null }),
      setDietGoal: (g) => set({ dietGoal: g }),
      clearDietGoal: () => set({ dietGoal: null }),
    }),
    { name: 'finance-budhha-goals' },
  ),
)
