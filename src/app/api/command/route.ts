import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

type CommandIntent =
  | 'add_spend'
  | 'add_loan'
  | 'add_income'
  | 'summary'
  | 'pain_points'
  | 'spend_breakdown'
  | 'debt_analysis'
  | 'monthly_report'
  | 'what_if'
  | 'navigate'
  | 'unknown'

type CommandContext = {
  totals?: {
    income?: number
    emi?: number
    spends?: number
    net?: number
    emiRatio?: number
    spendRatio?: number
    savingsRatio?: number
  }
  strategy?: string
  loanCount?: number
  topCategories?: Array<{ category: string; amount: number }>
  thisMonth?: { income?: number; spends?: number; net?: number }
  painPoints?: string[]
  monthlySeries?: Array<{ month: string; income: number; spends: number; net: number }>
  nowISO?: string
}

type CommandResult = {
  intent: CommandIntent
  data?: Record<string, unknown>
  feedback: string
  card?: {
    title: string
    body: string
    ctaLabel?: string
    ctaHref?: string
  }
}

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function parseFirstNumber(text: string): number | null {
  const normalized = text.replace(/,/g, '').toLowerCase()
  const m = normalized.match(/(\d+(?:\.\d+)?)(\s*)(k|l|lac|lakh)?/)
  if (!m) return null
  const base = Number(m[1])
  if (!Number.isFinite(base)) return null
  const unit = (m[3] ?? '').toLowerCase()
  if (unit === 'k') return Math.round(base * 1_000)
  if (unit === 'l' || unit === 'lac' || unit === 'lakh') return Math.round(base * 100_000)
  return Math.round(base)
}

function includesOne(text: string, words: string[]) {
  return words.some((w) => text.includes(w))
}

function inferSpendCategory(text: string): {
  category: 'food' | 'travel' | 'shopping' | 'entertainment' | 'fuel' | 'utilities' | 'health' | 'other'
  matchedKeyword?: string
} {
  const q = text.toLowerCase()

  const dictionary: Array<{ category: 'food' | 'travel' | 'shopping' | 'entertainment' | 'fuel' | 'utilities' | 'health' | 'other'; words: string[] }> = [
    { category: 'food', words: ['food', 'meal', 'snack', 'restaurant', 'zomato', 'swiggy', 'coffee', 'tea', 'lunch', 'dinner'] },
    { category: 'travel', words: ['travel', 'uber', 'ola', 'taxi', 'cab', 'metro', 'bus', 'auto', 'train', 'flight'] },
    { category: 'fuel', words: ['fuel', 'petrol', 'diesel', 'cng'] },
    { category: 'shopping', words: ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'gadget', 'electronics'] },
    { category: 'entertainment', words: ['movie', 'netflix', 'prime', 'hotstar', 'party', 'gaming', 'concert'] },
    { category: 'utilities', words: ['electricity', 'wifi', 'internet', 'bill', 'mobile recharge', 'water', 'rent'] },
    { category: 'health', words: ['medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'gym', 'protein', 'vape', 'vaping', 'cigarette', 'smoke', 'smoking'] },
  ]

  for (const entry of dictionary) {
    const hit = entry.words.find((w) => q.includes(w))
    if (hit) return { category: entry.category, matchedKeyword: hit }
  }

  return { category: 'other' }
}

function inferSpendDateISO(text: string, now: Date) {
  const q = text.toLowerCase()
  if (q.includes('yesterday')) return new Date(now.getTime() - 86_400_000).toISOString()
  return now.toISOString()
}

function inferIncomeSource(text: string): 'salary' | 'bonus' | 'other' {
  const q = text.toLowerCase()
  if (q.includes('bonus')) return 'bonus'
  if (includesOne(q, ['salary', 'credited', 'paycheck', 'pay day', 'payday'])) return 'salary'
  return 'other'
}

function ruleBasedWriteParse(command: string, now: Date): CommandResult | null {
  const q = command.toLowerCase().trim()
  const amount = parseFirstNumber(q)

  const hasIncomeSignal = includesOne(q, ['income', 'salary', 'credited', 'received', 'bonus', 'freelance', 'got paid'])
  const hasLoanSignal = includesOne(q, ['emi', 'loan', 'debt', 'borrowed'])
  const hasSpendSignal = includesOne(q, ['exp', 'expense', 'spent', 'paid', 'bought', 'ordered', 'purchase', 'add'])

  if (hasLoanSignal && amount && amount > 0) {
    return {
      intent: 'add_loan',
      feedback: `Parsed as loan command from: "${command}"`,
      data: {
        lenderName: 'Unknown',
        label: q.includes('car') ? 'Car Loan' : q.includes('home') ? 'Home Loan' : 'Loan',
        monthlyEmi: amount,
        principalOutstanding: amount * 48,
        annualInterestRate: 12,
        dueDayOfMonth: now.getDate(),
        parsedFrom: command,
      },
      card: {
        title: 'Parsed loan command',
        body: `Command: ${command}\nDetected EMI: ${fmtINR(amount)}\nDefaulted principal to ${fmtINR(amount * 48)}.`,
        ctaLabel: 'Open loans',
        ctaHref: '/finance/loans',
      },
    }
  }

  if (hasIncomeSignal && amount && amount > 0) {
    const source = inferIncomeSource(q)
    return {
      intent: 'add_income',
      feedback: `Parsed as income command from: "${command}"`,
      data: {
        source,
        amount,
        receivedAt: now.toISOString(),
        note: command,
        parsedFrom: command,
      },
      card: {
        title: 'Parsed income command',
        body: `Command: ${command}\nDetected source: ${source}\nDetected amount: ${fmtINR(amount)}.`,
        ctaLabel: 'Open income',
        ctaHref: '/finance/income',
      },
    }
  }

  // Unstructured spend capture (example: "add 2k vape today")
  if (hasSpendSignal && amount && amount > 0) {
    const category = inferSpendCategory(q)
    const matched = category.matchedKeyword ?? 'generic spend'
    return {
      intent: 'add_spend',
      feedback: `Parsed spend from: "${command}" → category: ${category.category}`,
      data: {
        category: category.category,
        amount,
        memo: command,
        merchant: category.matchedKeyword,
        spentAt: inferSpendDateISO(q, now),
        parsedFrom: command,
        matchedKeyword: matched,
      },
      card: {
        title: 'Parsed spend command',
        body: `Command: ${command}\nDetected amount: ${fmtINR(amount)}\nDetected segment: ${category.category} (keyword: ${matched})`,
        ctaLabel: 'Open spends',
        ctaHref: '/finance/spends',
      },
    }
  }

  return null
}

function localFallback(command: string, context: CommandContext): CommandResult {
  const now = new Date()
  const writeParsed = ruleBasedWriteParse(command, now)
  if (writeParsed) return writeParsed
  const q = command.toLowerCase().trim()
  const totals = context.totals ?? {}
  const topCats = context.topCategories ?? []
  const painPoints = context.painPoints ?? []

  if (q.includes('summary') || q.includes('overview') || q.includes('status') || q.includes('showcase')) {
    return {
      intent: 'summary',
      feedback: 'Summary generated',
      card: {
        title: 'Portfolio summary',
        body: `Income ${fmtINR(totals.income ?? 0)} • EMI ${fmtINR(totals.emi ?? 0)} • Spends ${fmtINR(totals.spends ?? 0)} • Net ${fmtINR(totals.net ?? 0)}`,
        ctaLabel: 'Open dashboard',
        ctaHref: '/',
      },
    }
  }

  if (q.includes('pain') || q.includes('risk') || q.includes('problem') || q.includes('issue')) {
    return {
      intent: 'pain_points',
      feedback: 'Pain points generated',
      card: {
        title: 'Pain-point queue',
        body: painPoints.length ? painPoints.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join('\n') : 'No major pain points detected.',
        ctaLabel: 'Open finance',
        ctaHref: '/finance',
      },
    }
  }

  if (q.includes('spend') || q.includes('expense') || q.includes('category') || q.includes('leak')) {
    return {
      intent: 'spend_breakdown',
      feedback: 'Spend analysis generated',
      card: {
        title: 'Spend analysis',
        body: `Spend leakage ${totals.spendRatio != null ? pct(totals.spendRatio) : '—'} of income\nTop categories: ${topCats.length ? topCats.map((c) => `${c.category} ${fmtINR(c.amount)}`).join(' • ') : 'No spends yet'}`,
        ctaLabel: 'Open spends',
        ctaHref: '/finance/spends',
      },
    }
  }

  if (q.includes('loan') || q.includes('emi') || q.includes('debt')) {
    return {
      intent: 'debt_analysis',
      feedback: 'Debt analysis generated',
      card: {
        title: 'Debt status',
        body: `Active loans: ${context.loanCount ?? 0}\nEMI: ${fmtINR(totals.emi ?? 0)}\nEMI ratio: ${totals.emiRatio != null ? pct(totals.emiRatio) : '—'}\nStrategy: ${context.strategy ?? 'avalanche'}`,
        ctaLabel: 'Open strategy',
        ctaHref: '/finance/strategy',
      },
    }
  }

  if (q.includes('what if') || q.includes('cut') || q.includes('reduce')) {
    const amount = parseFirstNumber(q)
    const cut = amount ?? Math.round((totals.spends ?? 0) * 0.2)
    const newNet = (totals.net ?? 0) + cut
    return {
      intent: 'what_if',
      feedback: 'Scenario projected',
      data: { cutAmount: cut, projectedNet: newNet },
      card: {
        title: 'What-if scenario',
        body: `If you reduce spends by ${fmtINR(cut)}, projected net becomes ${fmtINR(newNet)}.`,
        ctaLabel: 'Review spends',
        ctaHref: '/finance/spends',
      },
    }
  }

  return {
    intent: 'unknown',
    feedback: 'Try commands like: summary, show pain points, analyse spends, debt status, what if I cut spends by 5000, add 2k vape today.',
  }
}

function normalizeResult(raw: unknown): CommandResult {
  const safe: CommandResult = {
    intent: 'unknown',
    feedback: 'I could not classify this. Try: summary, analyse spends, debt status, add 2k vape today.',
  }

  if (!raw || typeof raw !== 'object') return safe
  const obj = raw as Record<string, unknown>
  const intent = typeof obj.intent === 'string' ? obj.intent : 'unknown'
  const feedback = typeof obj.feedback === 'string' ? obj.feedback : safe.feedback

  const allowed: CommandIntent[] = [
    'add_spend',
    'add_loan',
    'add_income',
    'summary',
    'pain_points',
    'spend_breakdown',
    'debt_analysis',
    'monthly_report',
    'what_if',
    'navigate',
    'unknown',
  ]

  safe.intent = allowed.includes(intent as CommandIntent) ? (intent as CommandIntent) : 'unknown'
  safe.feedback = feedback

  if (obj.data && typeof obj.data === 'object') {
    safe.data = obj.data as Record<string, unknown>
  }

  if (obj.card && typeof obj.card === 'object') {
    const card = obj.card as Record<string, unknown>
    const title = typeof card.title === 'string' ? card.title : undefined
    const body = typeof card.body === 'string' ? card.body : undefined
    if (title && body) {
      safe.card = {
        title,
        body,
        ctaLabel: typeof card.ctaLabel === 'string' ? card.ctaLabel : undefined,
        ctaHref: typeof card.ctaHref === 'string' ? card.ctaHref : undefined,
      }
    }
  }

  return safe
}

export async function POST(req: NextRequest) {
  try {
    const { command, context, history } = await req.json() as {
      command: string
      context?: CommandContext
      history?: Array<{ role: 'user' | 'assistant'; text: string }>
    }

    if (!command?.trim()) {
      return NextResponse.json({ error: 'Empty command' }, { status: 400 })
    }

    const cleanCommand = command.trim()
    const safeContext: CommandContext = context ?? {}
    const safeHistory = Array.isArray(history)
      ? history.slice(-10).map((h) => ({ role: h.role, text: String(h.text ?? '').slice(0, 300) }))
      : []

    // Offline deterministic fallback when model key is missing
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(localFallback(cleanCommand, safeContext))
    }

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const now = new Date()
    const todayISO = now.toISOString()
    const yesterdayISO = new Date(now.getTime() - 86_400_000).toISOString()
    const currentDayOfMonth = now.getDate()

    const systemPrompt = `You are the command brain for Finance Budhha.
Scope: ONLY this personal finance app. Do not answer generic unrelated questions.
Return ONLY a raw JSON object. No markdown.

Time context:
- now=${todayISO}
- yesterday=${yesterdayISO}
- currentDayOfMonth=${currentDayOfMonth}

Amount rules:
- 10k=10000, 2.5k=2500, 1L=100000, 1.5L=150000 (INR)

Primary intents:
add_spend, add_loan, add_income,
summary, pain_points, spend_breakdown, debt_analysis, monthly_report, what_if, navigate, unknown.

Output schema:
{
  "intent": "...",
  "data": { ...optional structured fields... },
  "feedback": "short human confirmation",
  "card": {
    "title": "short title",
    "body": "2-5 lines using only provided app context numbers",
    "ctaLabel": "optional",
    "ctaHref": "optional route starting with /"
  }
}

For add_spend:
- data.category from [food,travel,shopping,entertainment,fuel,utilities,health,other]
- data.amount numeric mandatory
- data.spentAt ISO datetime default now
- infer category from object/merchant keywords in unstructured text.
- Example: "add 2k vape today" => intent=add_spend, amount=2000, category=health, memo keeps original command.

For add_loan:
- data.monthlyEmi numeric mandatory
- Defaults: principalOutstanding=monthlyEmi*48, annualInterestRate=12, dueDayOfMonth=${currentDayOfMonth}

For add_income:
- data.source from [salary,bonus,other]
- data.amount numeric mandatory
- data.receivedAt ISO datetime default now

For analyze intents (summary, pain_points, spend_breakdown, debt_analysis, monthly_report, what_if):
- use ONLY provided APP_CONTEXT data.
- do not invent numbers.
- ctaHref should be one of /, /finance, /finance/spends, /finance/strategy, /finance/income, /finance/loans, /goals, /ai-buddy

For navigate:
- set data.href route and card fields accordingly.

If unclear, return intent=unknown with actionable feedback examples.`

    const userPrompt = JSON.stringify({
      command: cleanCommand,
      appContext: safeContext,
      history: safeHistory,
    })

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 700,
    })

    const rawText = completion.choices[0].message.content ?? '{}'
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(localFallback(cleanCommand, safeContext))
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(localFallback(cleanCommand, safeContext))
    }

    const result = normalizeResult(parsed)

    if (result.intent === 'unknown') {
      const recovered = ruleBasedWriteParse(cleanCommand, new Date())
      if (recovered) return NextResponse.json(recovered)
    }

    return NextResponse.json(result)
  } catch (err) {
    // Only log errors in development to avoid exposing details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Command API] Error:', err instanceof Error ? err.message : String(err))
    }
    return NextResponse.json({ error: 'Command processing failed. Try again.' }, { status: 500 })
  }
}
