import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EmiLoan, IncomeEntry, UnnecessarySpend, DebtRepaymentStrategy } from '../types/finance'

interface FinanceState {
  incomes: IncomeEntry[]
  loans: EmiLoan[]
  spends: UnnecessarySpend[]
  strategy: DebtRepaymentStrategy

  addIncome: (income: IncomeEntry) => void
  removeIncome: (id: string) => void

  addLoan: (loan: EmiLoan) => void
  updateLoan: (id: string, patch: Partial<EmiLoan>) => void
  removeLoan: (id: string) => void

  addSpend: (spend: UnnecessarySpend) => void
  removeSpend: (id: string) => void

  setStrategy: (s: DebtRepaymentStrategy) => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      incomes: [],
      loans: [],
      spends: [],
      strategy: 'avalanche',

      addIncome: (income) => set((s) => ({ incomes: [income, ...s.incomes] })),
      removeIncome: (id) => set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

      addLoan: (loan) => set((s) => ({ loans: [loan, ...s.loans] })),
      updateLoan: (id, patch) =>
        set((s) => ({ loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLoan: (id) => set((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),

      addSpend: (spend) => set((s) => ({ spends: [spend, ...s.spends] })),
      removeSpend: (id) => set((s) => ({ spends: s.spends.filter((sp) => sp.id !== id) })),

      setStrategy: (strategy) => set({ strategy }),
    }),
    { name: 'finance-budhha-finance' },
  ),
)
