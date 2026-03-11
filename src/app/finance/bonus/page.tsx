'use client'
import { useState } from 'react'
import { useFinanceStore } from '../../../store/financeStore'
import { calculateBonusOptimizerInterestSavings } from '../../../lib/calculations/emiCalculator'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }

export default function BonusOptimizerPage() {
  const { loans } = useFinanceStore()
  const activeLoans = loans.filter(l => l.isActive && l.principalOutstanding > 0)
  const [bonus, setBonus] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateBonusOptimizerInterestSavings> | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    if (activeLoans.length === 0) { setError('No active loans to optimize.'); return }
    const amt = Number(bonus)
    if (!amt || amt <= 0) { setError('Enter a valid bonus amount.'); return }
    try {
      const res = calculateBonusOptimizerInterestSavings({ bonusAmount: amt, loans: activeLoans })
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const recLoan = result ? activeLoans.find(l => l.id === result.highestInterestLoanId) : null

  return (
    <div className="space-y-5 max-w-sm">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Bonus Optimizer</h1>
        <p className="text-sm text-slate-400">Find the best loan to prepay with your bonus</p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Bonus / extra amount (₹)</label>
          <input className="input" type="number" min="0" step="0.01" placeholder="100000" value={bonus} onChange={e => setBonus(e.target.value)} />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button className="btn-primary w-full" onClick={calculate} disabled={activeLoans.length === 0}>
          {activeLoans.length === 0 ? 'Add loans first' : 'Calculate'}
        </button>
      </div>

      {result && recLoan && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-bold text-slate-800">Prepay: {recLoan.label}</div>
              <div className="text-xs text-slate-400">{recLoan.lenderName} · {recLoan.annualInterestRate}% p.a.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-slate-400">Interest saved (highest)</div>
              <div className="font-bold text-emerald-600">{fmt(result.interestSavedOnHighest)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400">Interest saved (lowest)</div>
              <div className="font-bold text-slate-600">{fmt(result.interestSavedOnLowest)}</div>
            </div>
          </div>
          {result.extraInterestSavedByChoosingHighest > 0 && (
            <p className="text-xs text-emerald-600 font-medium">
              💡 Choosing the highest-rate loan saves you {fmt(result.extraInterestSavedByChoosingHighest)} extra!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
