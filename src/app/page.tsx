'use client'
import { useFinanceStore } from '../store/financeStore'
import { useGoalsStore } from '../store/goalsStore'
import Link from 'next/link'
import {
  Activity,
  Cigarette,
  Salad,
  ArrowRight,
  CircleAlert,
  CalendarCheck2,
  ShieldCheck,
  Sparkles,
  Wallet,
  BadgeIndianRupee,
} from 'lucide-react'
import { PROFILE } from '../constants/profile'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

function monthKey(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

function parseDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function valueToStep(value: number, max: number, steps: number) {
  if (max <= 0) return 0
  return Math.max(0, Math.min(steps - 1, Math.round((value / max) * (steps - 1))))
}

const HEIGHT_CLASSES = [
  'h-1',
  'h-2',
  'h-4',
  'h-6',
  'h-8',
  'h-10',
  'h-12',
  'h-14',
  'h-16',
  'h-20',
  'h-24',
  'h-28',
  'h-32',
]

type SegmentTone = 'emerald' | 'amber' | 'red' | 'brand' | 'slate'

const TONE_CLASS: Record<SegmentTone, { on: string; off: string }> = {
  emerald: { on: 'bg-emerald-500', off: 'bg-emerald-100' },
  amber: { on: 'bg-amber-500', off: 'bg-amber-100' },
  red: { on: 'bg-red-500', off: 'bg-red-100' },
  brand: { on: 'bg-brand-500', off: 'bg-brand-100' },
  slate: { on: 'bg-slate-600', off: 'bg-slate-200' },
}

function SegmentBar({ ratio, tone = 'brand' }: { ratio: number; tone?: SegmentTone }) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const filled = Math.round(normalized * 20)

  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-1 rounded-full ${i < filled ? TONE_CLASS[tone].on : TONE_CLASS[tone].off}`}
        />
      ))}
    </div>
  )
}

type PainPoint = {
  id: string
  title: string
  detail: string
  severity: 'High' | 'Medium' | 'Low'
  href: string
  action: string
  impact: string
}

export default function DashboardPage() {
  const { incomes, loans, spends } = useFinanceStore()
  const { smokingGoal, dietGoal } = useGoalsStore()

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalEmi    = loans.filter(l => l.isActive).reduce((s, l) => s + l.monthlyEmi, 0)
  const totalSpends = spends.reduce((s, sp) => s + sp.amount, 0)
  const netSavings  = totalIncome - totalEmi - totalSpends
  const emiRatio = totalIncome > 0 ? totalEmi / totalIncome : 0
  const spendRatio = totalIncome > 0 ? totalSpends / totalIncome : 0
  const savingsRatio = totalIncome > 0 ? netSavings / totalIncome : 0

  const savingsHealth = totalIncome > 0 ? Math.max(0, Math.min(1, (savingsRatio + 0.10) / 0.40)) : 0
  const emiHealth = totalIncome > 0 ? Math.max(0, Math.min(1, 1 - (emiRatio / 0.55))) : 0
  const spendHealth = totalIncome > 0 ? Math.max(0, Math.min(1, 1 - (spendRatio / 0.30))) : 0
  const financialHealth = Math.round((savingsHealth * 45 + emiHealth * 35 + spendHealth * 20) * 100) / 100
  const healthScore = Math.round(financialHealth)
  const healthLabel = healthScore >= 75 ? 'Strong' : healthScore >= 50 ? 'Improving' : 'Needs attention'
  const activeLoans = loans.filter(l => l.isActive)

  const now = new Date()
  const smokingMs = smokingGoal
    ? now.getTime() - new Date(smokingGoal.lastSmokeAt).getTime()
    : 0
  const smokingDays = Math.floor(smokingMs / 86400000)
  const moneySaved = smokingGoal
    ? Math.floor((smokingMs / 3600000) * (smokingGoal.baselineCigarettesPerDay / 24) * smokingGoal.pricePerCigarette)
    : 0

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key: monthKey(d),
      label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d),
    }
  })

  const incomeByMonth = new Map<string, number>()
  const spendByMonth = new Map<string, number>()

  incomes.forEach((i) => {
    const d = parseDate(i.receivedAt)
    if (!d) return
    const key = monthKey(d)
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + i.amount)
  })

  spends.forEach((s) => {
    const d = parseDate(s.spentAt)
    if (!d) return
    const key = monthKey(d)
    spendByMonth.set(key, (spendByMonth.get(key) ?? 0) + s.amount)
  })

  const cashflowSeries = months.map((m) => {
    const income = incomeByMonth.get(m.key) ?? 0
    const spend = spendByMonth.get(m.key) ?? 0
    // Calculate EMI only for months where loan was active
    const monthEmi = activeLoans
      .filter(l => !l.openedOn || new Date(l.openedOn) <= new Date(m.key + '-01'))
      .reduce((s, l) => s + l.monthlyEmi, 0)
    const net = income - spend - monthEmi
    return { ...m, income, spend, net }
  })

  const maxChartValue = Math.max(1, ...cashflowSeries.map((m) => Math.max(m.income, m.spend, Math.max(0, m.net))))

  const spendByCategoryMap = new Map<string, number>()
  spends.forEach((s) => {
    const category = s.category?.trim() || 'other'
    spendByCategoryMap.set(category, (spendByCategoryMap.get(category) ?? 0) + s.amount)
  })
  const spendByCategory = Array.from(spendByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const topCategoryMax = Math.max(1, ...spendByCategory.map((c) => c.amount), 0)

  const painPoints: PainPoint[] = []

  if (totalIncome === 0) {
    painPoints.push({
      id: 'no-income',
      title: 'No income tracked yet',
      detail: 'Start by adding monthly income to unlock realistic budget and debt planning.',
      severity: 'High',
      href: '/finance/income/add',
      action: 'Add income',
      impact: 'All downstream metrics are blocked',
    })
  }

  if (netSavings < 0) {
    painPoints.push({
      id: 'negative-savings',
      title: 'Monthly cashflow is negative',
      detail: `You are short by ${fmt(Math.abs(netSavings))}. Reduce leaks or increase income this week.`,
      severity: 'High',
      href: '/finance/spends',
      action: 'Review spends',
      impact: `Burning ${fmt(Math.abs(netSavings))}/month`,
    })
  }

  if (emiRatio > 0.35 && totalIncome > 0) {
    painPoints.push({
      id: 'high-emi-ratio',
      title: 'EMI burden is high',
      detail: `EMI is ${pct(emiRatio)} of income. Aim for under 35% for healthier flexibility.`,
      severity: 'Medium',
      href: '/finance/strategy',
      action: 'Tune repayment strategy',
      impact: 'High debt stress and lower flexibility',
    })
  }

  if (spendRatio > 0.2 && totalIncome > 0) {
    painPoints.push({
      id: 'high-spend-ratio',
      title: 'Optional spends are eating savings',
      detail: `Unnecessary spends are ${pct(spendRatio)} of income. Trim top categories first.`,
      severity: 'Medium',
      href: '/finance/spends',
      action: 'Cut spend leaks',
      impact: `Potential recovery ${fmt(totalSpends * 0.2)}/month`,
    })
  }

  if (!smokingGoal) {
    painPoints.push({
      id: 'no-smoking-goal',
      title: 'No smoke-free tracker active',
      detail: 'A smoking tracker converts better habits directly into saved money.',
      severity: 'Low',
      href: '/goals',
      action: 'Set smoking goal',
      impact: 'Behavioral savings data missing',
    })
  }

  const severityScore: Record<PainPoint['severity'], number> = { High: 3, Medium: 2, Low: 1 }
  const priorityPainPoints = painPoints
    .sort((a, b) => severityScore[b.severity] - severityScore[a.severity])
    .slice(0, 4)

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now)

  const severityClass: Record<PainPoint['severity'], string> = {
    High: 'bg-red-50 text-red-600',
    Medium: 'bg-amber-50 text-amber-600',
    Low: 'bg-emerald-50 text-emerald-600',
  }

  const monthWithWorstNet = cashflowSeries.reduce((acc, cur) => (cur.net < acc.net ? cur : acc), cashflowSeries[0] ?? { label: '—', net: 0 })
  const bestMonth = cashflowSeries.reduce((acc, cur) => (cur.net > acc.net ? cur : acc), cashflowSeries[0] ?? { label: '—', net: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hey, {PROFILE.displayName} 👋</h1>
          <p className="text-slate-400 text-sm mt-0.5">Data-first command center for your money system</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <CalendarCheck2 size={14} className="text-brand-600" />
          {dateLabel}
        </div>
      </div>

      <section className="rounded-2xl p-5 sm:p-6 text-white bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-100/90 font-semibold">Financial health score</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-4xl font-bold leading-none">{healthScore}</span>
              <span className="text-emerald-100 text-sm mb-1">/ 100</span>
            </div>
            <div className="mt-2 text-sm text-emerald-100/95">Status: {healthLabel}</div>
          </div>
          <div className="shrink-0 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-right">
            <div className="text-xs text-emerald-100/80">Live net monthly cashflow</div>
            <div className="text-xl font-semibold">{fmt(netSavings)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
            <div className="text-emerald-100/80">Savings rate</div>
            <div className="font-semibold mt-0.5">{totalIncome > 0 ? pct(savingsRatio) : '—'}</div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
            <div className="text-emerald-100/80">EMI load</div>
            <div className="font-semibold mt-0.5">{totalIncome > 0 ? pct(emiRatio) : '—'}</div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
            <div className="text-emerald-100/80">Spend leak</div>
            <div className="font-semibold mt-0.5">{totalIncome > 0 ? pct(spendRatio) : '—'}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Total income</div>
          <div className="mt-1 text-xl font-bold text-emerald-600">{fmt(totalIncome)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><BadgeIndianRupee size={12} /> tracked cash-in</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Monthly EMI load</div>
          <div className="mt-1 text-xl font-bold text-amber-600">{fmt(totalEmi)}</div>
          <div className="text-xs text-slate-500 mt-1">{activeLoans.length} active loans</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Spend leakage</div>
          <div className="mt-1 text-xl font-bold text-red-500">{fmt(totalSpends)}</div>
          <div className="text-xs text-slate-500 mt-1">{totalIncome > 0 ? pct(spendRatio) : '—'} of income</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Net savings</div>
          <div className={`mt-1 text-xl font-bold ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(netSavings)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Wallet size={12} /> post EMI + spends</div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="card xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Activity size={16} className="text-brand-600" />
              Cashflow trend (last 6 months)
            </h2>
            <Link href="/finance" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">Deep dive <ArrowRight size={12} /></Link>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {cashflowSeries.map((m) => {
              const incomeStep = valueToStep(m.income, maxChartValue, HEIGHT_CLASSES.length)
              const spendStep = valueToStep(m.spend, maxChartValue, HEIGHT_CLASSES.length)
              const netStep = valueToStep(Math.max(0, m.net), maxChartValue, HEIGHT_CLASSES.length)

              return (
                <div key={m.key} className="rounded-xl border border-slate-100 p-2 bg-slate-50/40">
                  <div className="h-32 flex items-end justify-center gap-1">
                    <div className={`w-2 rounded-t bg-emerald-500 ${HEIGHT_CLASSES[incomeStep]}`} title={`Income ${fmt(m.income)}`} />
                    <div className={`w-2 rounded-t bg-red-400 ${HEIGHT_CLASSES[spendStep]}`} title={`Spends ${fmt(m.spend)}`} />
                    <div className={`w-2 rounded-t ${m.net >= 0 ? 'bg-brand-500' : 'bg-amber-500'} ${HEIGHT_CLASSES[netStep]}`} title={`Net ${fmt(m.net)}`} />
                  </div>
                  <div className="mt-2 text-center text-[11px] text-slate-500 font-medium">{m.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs">
              <div className="text-slate-500">Best month</div>
              <div className="font-semibold text-emerald-700 mt-1">{bestMonth.label}: {fmt(bestMonth.net)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs">
              <div className="text-slate-500">Weakest month</div>
              <div className="font-semibold text-red-600 mt-1">{monthWithWorstNet.label}: {fmt(monthWithWorstNet.net)}</div>
            </div>
          </div>
        </div>

        <div className="card xl:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-700">Spend concentration by category</h2>
          {spendByCategory.length === 0 ? (
            <div className="text-sm text-slate-400">No spend data yet. Log spends to unlock category analytics.</div>
          ) : (
            spendByCategory.map((cat) => {
              const ratio = cat.amount / topCategoryMax
              const tone: SegmentTone = ratio > 0.75 ? 'red' : ratio > 0.45 ? 'amber' : 'brand'
              return (
                <div key={cat.category} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium text-slate-700 capitalize">{cat.category}</div>
                    <div className="font-semibold text-slate-700">{fmt(cat.amount)}</div>
                  </div>
                  <div className="mt-2">
                    <SegmentBar ratio={ratio} tone={tone} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Priority pain-point queue</h2>
          <Link href="/finance/strategy" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">Resolve with strategy <ArrowRight size={12} /></Link>
        </div>

        {priorityPainPoints.length > 0 ? (
          <div className="space-y-2.5">
            {priorityPainPoints.map((point, idx) => (
              <div key={point.id} className="card p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">P{idx + 1}</span>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${severityClass[point.severity]}`}>
                      {point.severity}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-700 text-sm mt-2 flex items-center gap-2">
                    <CircleAlert size={14} className="text-slate-500 shrink-0" />
                    {point.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5">{point.detail}</p>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Impact: {point.impact}</p>
                </div>
                <Link href={point.href} className="btn-secondary text-xs whitespace-nowrap self-center">{point.action}</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card flex items-start gap-3">
            <ShieldCheck size={18} className="text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-700 text-sm">No major friction areas detected</div>
              <p className="text-xs text-slate-500 mt-1">You are operating in a healthy range. Keep tracking weekly to maintain momentum.</p>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Behavioral signal overlay</div>
            <h2 className="font-semibold text-slate-700 mt-1">Lifestyle impact on finances</h2>
          </div>
          <Link href="/goals" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">Open goals <ArrowRight size={12} /></Link>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Cigarette size={14} className="text-emerald-600" /> Smoke-free progress</div>
            {smokingGoal ? (
              <>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{smokingDays} days</div>
                <div className="text-xs text-slate-500 mt-1">Recovered value: {fmt(moneySaved)}</div>
              </>
            ) : (
              <div className="text-xs text-slate-500 mt-2">No goal yet. Start tracking to capture behavior-linked savings.</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Salad size={14} className="text-brand-600" /> Diet discipline signal</div>
            {dietGoal ? (
              <>
                <div className="text-2xl font-bold text-brand-700 mt-1">{dietGoal.consumedCalories}/{dietGoal.targetCalories}</div>
                <div className="text-xs text-slate-500 mt-1">daily calorie adherence</div>
              </>
            ) : (
              <div className="text-xs text-slate-500 mt-2">No diet goal yet. Add it for daily discipline tracking.</div>
            )}
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-600" />
          <h2 className="font-semibold text-slate-700 text-sm">Smart next moves</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Link href="/finance/income/add" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 hover:bg-emerald-100 transition-colors">
            <div className="text-sm font-semibold text-emerald-700">Raise data quality</div>
            <div className="text-xs text-emerald-700/80 mt-1">Add latest income</div>
          </Link>
          <Link href="/finance/spends" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 hover:bg-red-100 transition-colors">
            <div className="text-sm font-semibold text-red-700">Attack largest leak</div>
            <div className="text-xs text-red-700/80 mt-1">Trim top spend category</div>
          </Link>
          <Link href="/ai-buddy" className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 hover:bg-brand-100 transition-colors">
            <div className="text-sm font-semibold text-brand-700">Generate weekly plan</div>
            <div className="text-xs text-brand-700/80 mt-1">Get AI-driven action list</div>
          </Link>
        </div>
      </section>

    </div>
  )
}
