'use client'
import { useFinanceStore } from '../../../store/financeStore'
import Link from 'next/link'
import { Trash2, PlusCircle } from 'lucide-react'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function SpendsPage() {
  const { spends, removeSpend } = useFinanceStore()
  const total = spends.reduce((s, sp) => s + sp.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Unnecessary Spends</h1>
          <p className="text-sm text-slate-400">Total: {fmt(total)}</p>
        </div>
        <Link href="/finance/spends/add" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={16} /> Log
        </Link>
      </div>

      {spends.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">
          No spends logged yet. <Link href="/finance/spends/add" className="text-brand-600 underline">Log one →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {spends.map((sp) => (
            <li key={sp.id} className="card flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">{fmt(sp.amount)}</div>
                <div className="text-xs text-slate-400">{sp.category}{sp.merchant ? ` · ${sp.merchant}` : ''} · {fmtDate(sp.spentAt)}</div>
                {sp.memo && <div className="text-xs text-slate-400 mt-0.5">{sp.memo}</div>}
              </div>
              <button onClick={() => removeSpend(sp.id)} className="text-slate-300 hover:text-red-400 transition-colors" aria-label={`Delete spend: ${sp.category}`} title={`Delete ${sp.category} expense`}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
