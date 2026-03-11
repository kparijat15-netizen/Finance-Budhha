'use client'
import { useFinanceStore } from '../../store/financeStore'
import StatCard from '../../components/StatCard'
import Link from 'next/link'
import { TrendingUp, CreditCard, AlertTriangle, BarChart2, ArrowRight } from 'lucide-react'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function FinancePage() {
  const { incomes, loans, spends, strategy } = useFinanceStore()

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const activeLoans = loans.filter(l => l.isActive)
  const totalEmi    = activeLoans.reduce((s, l) => s + l.monthlyEmi, 0)
  const totalPrincipal = activeLoans.reduce((s, l) => s + l.principalOutstanding, 0)
  const totalSpends = spends.reduce((s, sp) => s + sp.amount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Finance</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Income" value={fmt(totalIncome)} accent="green" icon={<TrendingUp size={14} />} />
        <StatCard label="Monthly EMI" value={fmt(totalEmi)} accent="amber" icon={<CreditCard size={14} />} />
        <StatCard label="Total Debt" value={fmt(totalPrincipal)} accent="red" icon={<BarChart2 size={14} />} />
        <StatCard label="Spends" value={fmt(totalSpends)} accent="red" icon={<AlertTriangle size={14} />} />
      </div>

      {/* Sections */}
      {[
        { href: '/finance/income', label: 'Income', count: incomes.length, cta: '+ Add Income' },
        { href: '/finance/loans',  label: 'EMI Loans', count: activeLoans.length, cta: '+ Add Loan' },
        { href: '/finance/spends', label: 'Unnecessary Spends', count: spends.length, cta: '+ Log Spend' },
        { href: '/finance/bonus',  label: 'Bonus Optimizer', count: null, cta: 'Open' },
      ].map(({ href, label, count, cta }) => (
        <Link key={href} href={href} className="card flex items-center justify-between group">
          <div>
            <div className="font-semibold text-slate-700">{label}</div>
            {count !== null && <div className="text-xs text-slate-400">{count} entries</div>}
          </div>
          <div className="flex items-center gap-2 text-brand-600 text-sm font-medium">
            {cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ))}

      <div className="card flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-700">Debt Strategy</div>
          <div className="text-xs text-slate-400 capitalize">{strategy}</div>
        </div>
        <Link href="/finance/strategy" className="btn-secondary text-sm">Change</Link>
      </div>
    </div>
  )
}
