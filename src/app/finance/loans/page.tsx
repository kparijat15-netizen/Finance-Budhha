'use client'
import { useFinanceStore } from '../../../store/financeStore'
import Link from 'next/link'
import { Trash2, PlusCircle } from 'lucide-react'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function pct(r: number) { return r.toFixed(2) + '% p.a.' }

export default function LoansPage() {
  const { loans, removeLoan, updateLoan } = useFinanceStore()
  const activeLoans = loans.filter(l => l.isActive)
  const totalEmi = activeLoans.reduce((s, l) => s + l.monthlyEmi, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">EMI Loans</h1>
          <p className="text-sm text-slate-400">Monthly EMI: {fmt(totalEmi)}</p>
        </div>
        <Link href="/finance/loans/add" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={16} /> Add
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">
          No loans added yet. <Link href="/finance/loans/add" className="text-brand-600 underline">Add one →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {loans.map((loan) => (
            <li key={loan.id} className={`card space-y-2 ${!loan.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{loan.label}</div>
                  <div className="text-xs text-slate-400">{loan.lenderName}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => updateLoan(loan.id, { isActive: !loan.isActive })} className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title={loan.isActive ? 'Mark as closed' : 'Mark as active'}>
                    {loan.isActive ? 'Active' : 'Closed'}
                  </button>
                  <button onClick={() => removeLoan(loan.id)} className="text-slate-300 hover:text-red-400 transition-colors" aria-label={`Delete ${loan.label}`} title={`Delete ${loan.label}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-slate-400">Principal</span><br /><span className="font-medium">{fmt(loan.principalOutstanding)}</span></div>
                <div><span className="text-slate-400">Rate</span><br /><span className="font-medium">{pct(loan.annualInterestRate)}</span></div>
                <div><span className="text-slate-400">EMI</span><br /><span className="font-medium">{fmt(loan.monthlyEmi)}/mo</span></div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
