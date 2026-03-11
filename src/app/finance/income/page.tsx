'use client'
import { useFinanceStore } from '../../../store/financeStore'
import Link from 'next/link'
import { Trash2, PlusCircle } from 'lucide-react'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function IncomePage() {
  const { incomes, removeIncome } = useFinanceStore()
  const total = incomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Income</h1>
          <p className="text-sm text-slate-400">Total: {fmt(total)}</p>
        </div>
        <Link href="/finance/income/add" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={16} /> Add
        </Link>
      </div>

      {incomes.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">
          No income entries yet. <Link href="/finance/income/add" className="text-brand-600 underline">Add one →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {incomes.map((inc) => (
            <li key={inc.id} className="card flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">{fmt(inc.amount)}</div>
                <div className="text-xs text-slate-400 capitalize">{inc.source} · {fmtDate(inc.receivedAt)}</div>
                {inc.note && <div className="text-xs text-slate-400 mt-0.5">{inc.note}</div>}
              </div>
              <button onClick={() => removeIncome(inc.id)} className="text-slate-300 hover:text-red-400 transition-colors" aria-label={`Delete ${inc.source} income`} title={`Delete ${inc.source} income`}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
