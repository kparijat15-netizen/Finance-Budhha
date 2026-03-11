'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, Send, CheckCircle2, AlertCircle, Loader2, X, ChevronRight, BarChart3 } from 'lucide-react'
import { useFinanceStore } from '../store/financeStore'
import type { IncomeEntry, UnnecessarySpend, EmiLoan } from '../types/finance'

type Status = 'idle' | 'loading' | 'success' | 'error'
type Toast = { type: 'success' | 'error'; text: string }
type ChatTurn = { role: 'user' | 'assistant'; text: string }
type AssistantCard = {
  title: string
  body: string
  cta?: { label: string; href: string }
}

// Pages that have their own chat UI — hide the command bar there
const HIDDEN_ON = ['/ai-buddy']

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`
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

function includesOne(text: string, words: string[]) {
  return words.some((w) => text.includes(w))
}

export default function CommandBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [toast, setToast] = useState<Toast | null>(null)
  const [assistantCard, setAssistantCard] = useState<AssistantCard | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { addSpend, addLoan, addIncome, incomes, loans, spends, strategy } = useFinanceStore()

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const activeLoans = loans.filter((l) => l.isActive)
  const totalEmi = activeLoans.reduce((s, l) => s + l.monthlyEmi, 0)
  const totalSpends = spends.reduce((s, sp) => s + sp.amount, 0)
  const netSavings = totalIncome - totalEmi - totalSpends
  const emiRatio = totalIncome > 0 ? totalEmi / totalIncome : 0
  const spendRatio = totalIncome > 0 ? totalSpends / totalIncome : 0
  const savingsRatio = totalIncome > 0 ? netSavings / totalIncome : 0

  const spendByCategoryMap = new Map<string, number>()
  spends.forEach((sp) => {
    const key = sp.category?.trim() || 'other'
    spendByCategoryMap.set(key, (spendByCategoryMap.get(key) ?? 0) + sp.amount)
  })
  const topCategories = Array.from(spendByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  const now = new Date()
  const thisMonthKey = monthKey(now)
  const monthlyIncome = incomes.reduce((sum, i) => {
    const d = parseDate(i.receivedAt)
    if (!d) return sum
    return monthKey(d) === thisMonthKey ? sum + i.amount : sum
  }, 0)
  const monthlySpends = spends.reduce((sum, s) => {
    const d = parseDate(s.spentAt)
    if (!d) return sum
    return monthKey(d) === thisMonthKey ? sum + s.amount : sum
  }, 0)

  function buildPainPoints() {
    const points: string[] = []

    if (totalIncome === 0) points.push('No income has been tracked yet')
    if (netSavings < 0) points.push(`You are running negative by ${fmt(Math.abs(netSavings))} this month`)
    if (emiRatio > 0.35) points.push(`EMI pressure is high at ${pct(emiRatio)} of income`)
    if (spendRatio > 0.2) points.push(`Unnecessary spends are elevated at ${pct(spendRatio)} of income`)

    return points
  }

  const painPoints = buildPainPoints()

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = monthKey(d)
    const label = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d)
    return { key, label }
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

  const monthlySeries = months.map((m) => {
    const income = incomeByMonth.get(m.key) ?? 0
    const monthSpends = spendByMonth.get(m.key) ?? 0
    const net = income - monthSpends - totalEmi
    return { month: m.label, income, spends: monthSpends, net }
  })

  function quickSummaryCard(): AssistantCard {
    const topSpendsText = topCategories.length
      ? topCategories.map((c) => `${c.category}: ${fmt(c.amount)}`).join(' • ')
      : 'No spend categories yet'

    return {
      title: 'Live command summary',
      body: `Income ${fmt(totalIncome)} • EMI ${fmt(totalEmi)} • Spends ${fmt(totalSpends)} • Net ${fmt(netSavings)}\nSavings rate ${totalIncome > 0 ? pct(savingsRatio) : '—'} • EMI load ${totalIncome > 0 ? pct(emiRatio) : '—'}\nTop spend categories: ${topSpendsText}`,
      cta: { label: 'Open dashboard', href: '/' },
    }
  }

  function getLocalAssistantResponse(raw: string): AssistantCard | null {
    const q = raw.toLowerCase().trim()

    if (!q) return null

    // Navigation commands
    if (q.startsWith('open ') || q.startsWith('go to ')) {
      if (includesOne(q, ['finance', 'money'])) {
        router.push('/finance')
        return { title: 'Opened Finance', body: 'Navigated to the finance workspace for deeper analysis.', cta: { label: 'View finance', href: '/finance' } }
      }
      if (includesOne(q, ['goal', 'diet', 'smoking'])) {
        router.push('/goals')
        return { title: 'Opened Goals', body: 'Navigated to your goals workspace.', cta: { label: 'View goals', href: '/goals' } }
      }
      if (includesOne(q, ['dashboard', 'home'])) {
        router.push('/')
        return { title: 'Opened Dashboard', body: 'Navigated to your main command dashboard.', cta: { label: 'View dashboard', href: '/' } }
      }
    }

    if (includesOne(q, ['help', 'what can you do', 'commands'])) {
      return {
        title: 'AI bar commands',
        body: 'Try complex commands:\n• compare last 3 months net trend\n• what if I cut spending by 5000\n• give me top 3 pain points and fixes\n• monthly report with action plan\n• add exp 250 food today',
      }
    }

    return null
  }

  function addHistory(turn: ChatTurn) {
    setChatHistory((prev) => [...prev.slice(-11), turn])
  }

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || status === 'loading') return

    const trimmed = input.trim()
    addHistory({ role: 'user', text: trimmed })

    // Local-only helper commands (navigation/help)
    const localCard = getLocalAssistantResponse(trimmed)
    if (localCard) {
      setAssistantCard(localCard)
      setToast({ type: 'success', text: 'Insight ready' })
      addHistory({ role: 'assistant', text: `${localCard.title}: ${localCard.body}` })
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }

    setStatus('loading')

    try {
      const commandContext = {
        totals: {
          income: totalIncome,
          emi: totalEmi,
          spends: totalSpends,
          net: netSavings,
          emiRatio,
          spendRatio,
          savingsRatio,
        },
        strategy,
        loanCount: activeLoans.length,
        topCategories,
        thisMonth: {
          income: monthlyIncome,
          spends: monthlySpends,
          net: monthlyIncome - totalEmi - monthlySpends,
        },
        painPoints,
        monthlySeries,
        nowISO: now.toISOString(),
      }

      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          context: commandContext,
          history: chatHistory.slice(-8),
        }),
      })

      const result = await res.json() as {
        intent: string
        data?: Record<string, unknown>
        feedback?: string
        card?: { title?: string; body?: string; ctaLabel?: string; ctaHref?: string }
        error?: string
      }

      if (!res.ok || result.error) {
        throw new Error(result.error ?? `HTTP ${res.status}`)
      }

      const { intent, data, feedback, card } = result

      const fallbackCardFromApi = card?.title && card?.body
        ? {
            title: card.title,
            body: card.body,
            cta: card.ctaLabel && card.ctaHref ? { label: card.ctaLabel, href: card.ctaHref } : undefined,
          }
        : null

      if (intent === 'add_spend') {
        const spend: UnnecessarySpend = {
          id: crypto.randomUUID(),
          category: String(data?.category ?? 'other'),
          amount: Number(data?.amount),
          spentAt: String(data?.spentAt ?? new Date().toISOString()),
          merchant: data?.merchant ? String(data.merchant) : undefined,
          memo: data?.memo ? String(data.memo) : undefined,
        }
        addSpend(spend)
        setToast({ type: 'success', text: feedback ?? '✅ Spend recorded' })
        const parsedFrom = data?.parsedFrom ? String(data.parsedFrom) : null
        const matchedKeyword = data?.matchedKeyword ? String(data.matchedKeyword) : null
        const cardData = fallbackCardFromApi ?? {
          title: 'Spend added',
          body: `Logged ${fmt(spend.amount)} in ${spend.category}.\n${parsedFrom ? `Command: ${parsedFrom}\n` : ''}${matchedKeyword ? `Detected keyword: ${matchedKeyword}\n` : ''}Live net savings: ${fmt(netSavings - spend.amount)}`,
          cta: { label: 'Open spends', href: '/finance/spends' },
        }
        setAssistantCard(cardData)
        addHistory({ role: 'assistant', text: `${cardData.title}: ${cardData.body}` })
      } else if (intent === 'add_loan') {
        const emi = Number(data?.monthlyEmi)
        const loan: EmiLoan = {
          id: crypto.randomUUID(),
          lenderName: String(data?.lenderName ?? 'Unknown'),
          label: String(data?.label ?? 'Loan'),
          principalOutstanding: Number(data?.principalOutstanding) || emi * 48,
          annualInterestRate: Number(data?.annualInterestRate) || 12,
          monthlyEmi: emi,
          minMonthlyPayment: undefined,
          dueDayOfMonth: Number(data?.dueDayOfMonth) || new Date().getDate(),
          openedOn: new Date().toISOString().split('T')[0],
          isActive: true,
        }
        addLoan(loan)
        setToast({ type: 'success', text: feedback ?? '✅ Loan added' })
        const cardData = fallbackCardFromApi ?? {
          title: 'Loan added',
          body: `Added ${loan.label} with EMI ${fmt(loan.monthlyEmi)}.\nNew projected net: ${fmt(netSavings - loan.monthlyEmi)}`,
          cta: { label: 'Open loans', href: '/finance/loans' },
        }
        setAssistantCard(cardData)
        addHistory({ role: 'assistant', text: `${cardData.title}: ${cardData.body}` })
      } else if (intent === 'add_income') {
        const income: IncomeEntry = {
          id: crypto.randomUUID(),
          source: (String(data?.source ?? 'other') as 'salary' | 'bonus' | 'other'),
          amount: Number(data?.amount),
          receivedAt: String(data?.receivedAt ?? new Date().toISOString()),
          note: data?.note ? String(data.note) : undefined,
        }
        addIncome(income)
        setToast({ type: 'success', text: feedback ?? '✅ Income recorded' })
        const cardData = fallbackCardFromApi ?? {
          title: 'Income added',
          body: `Recorded ${fmt(income.amount)} from ${income.source}.\nNew projected net: ${fmt(netSavings + income.amount)}`,
          cta: { label: 'Open income', href: '/finance/income' },
        }
        setAssistantCard(cardData)
        addHistory({ role: 'assistant', text: `${cardData.title}: ${cardData.body}` })
      } else if (intent === 'navigate') {
        const href = typeof data?.href === 'string' ? data.href : '/'
        router.push(href)
        const cardData = fallbackCardFromApi ?? {
          title: 'Navigation complete',
          body: `Opened ${href}`,
          cta: { label: 'Open', href },
        }
        setAssistantCard(cardData)
        setToast({ type: 'success', text: feedback ?? 'Opened requested page' })
        addHistory({ role: 'assistant', text: `${cardData.title}: ${cardData.body}` })
      } else {
        const cardData = fallbackCardFromApi ?? quickSummaryCard()
        setAssistantCard(cardData)
        setToast({ type: 'success', text: feedback ?? 'Insight ready' })
        addHistory({ role: 'assistant', text: `${cardData.title}: ${cardData.body}` })
      }

      setInput('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setToast({ type: 'error', text: msg })
      const fallback = {
        title: 'Command failed',
        body: `${msg}\nTip: try commands like "summary", "show pain points", or "what if I cut spends by 5000".`,
      }
      setAssistantCard(fallback)
      addHistory({ role: 'assistant', text: `${fallback.title}: ${fallback.body}` })
    } finally {
      setStatus('idle')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    /* Position: above mobile bottom-nav (≈60 px) on small screens,
       tucked in bottom-right corner past the sidebar on desktop */
    <div className="fixed bottom-[68px] left-3 right-3 z-20 md:bottom-4 md:left-[220px] md:right-5">

      {/* ── Assistant response card ── */}
      {assistantCard && (
        <div className="mb-2.5 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_4px_18px_rgba(0,0,0,0.08)] p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 uppercase tracking-wide">
                <BarChart3 size={13} />
                {assistantCard.title}
              </div>
              <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line leading-relaxed">{assistantCard.body}</p>
              {assistantCard.cta && (
                <Link href={assistantCard.cta.href} className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium mt-2 hover:underline">
                  {assistantCard.cta.label} <ChevronRight size={12} />
                </Link>
              )}
            </div>
            <button
              onClick={() => setAssistantCard(null)}
              className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
              aria-label="Dismiss assistant response"
              title="Dismiss assistant response"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Toast feedback ── */}
      {toast && (
        <div
          className={`mb-2.5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl shadow-lg
            backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-200
            ${toast.type === 'success'
              ? 'bg-brand-500 text-white'
              : 'bg-red-500 text-white'
            }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            : <AlertCircle size={16} className="mt-0.5 shrink-0" />
          }
          <span className="flex-1 leading-snug">{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-70 hover:opacity-100 transition-opacity mt-0.5 shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Command input bar ── */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2.5 bg-white/90 backdrop-blur-xl
          shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-2xl px-3.5 py-2.5
          border transition-all duration-200
          ${status === 'loading'
            ? 'border-brand-400 shadow-brand-100/60'
            : 'border-slate-200 hover:border-brand-300 focus-within:border-brand-400 focus-within:shadow-brand-100/40'
          }`}
      >
        {/* AI indicator */}
        <div
          className={`shrink-0 transition-colors duration-300
            ${status === 'loading' ? 'text-brand-500 animate-spin' : 'text-brand-500'}`}
        >
          {status === 'loading'
            ? <Loader2 size={17} />
            : <Sparkles size={17} />
          }
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status === 'loading'}
          placeholder='try: compare last 3 months net trend  ·  what if I cut spends by 5k  ·  add exp 2k food today'
          className="flex-1 bg-transparent text-sm text-slate-700
            placeholder:text-slate-400 outline-none disabled:opacity-50
            min-w-0"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || status === 'loading'}
          aria-label="Run command"
          title="Run command"
          className="shrink-0 w-8 h-8 rounded-xl bg-brand-500 text-white
            flex items-center justify-center
            hover:bg-brand-600 active:scale-95
            disabled:opacity-35 disabled:cursor-not-allowed
            transition-all duration-150"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Subtle hint label */}
      <p className="text-center text-[10px] text-slate-400 mt-1 tracking-wide select-none">
        AI command bar — project-scoped finance chatbot (commands + analytics + what-if + navigation)
      </p>
    </div>
  )
}
