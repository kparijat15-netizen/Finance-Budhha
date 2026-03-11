'use client'
import { useState } from 'react'
import { useFinanceStore } from '../../store/financeStore'
import { Bot, Send } from 'lucide-react'
import { PROFILE } from '../../constants/profile'

interface Message { role: 'user' | 'ai'; text: string }

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }

function generateResponse(input: string, ctx: { totalIncome: number; totalEmi: number; totalSpends: number; netSavings: number; loanCount: number; strategy: string }): string {
  const q = input.toLowerCase()

  if (q.includes('save') || q.includes('saving')) {
    return `Based on your data, your net savings this period are ${fmt(ctx.netSavings)}. ${ctx.netSavings < 0 ? "⚠️ You're spending more than you earn. Consider reducing unnecessary spends." : "✅ Great job! Keep it up."}`
  }
  if (q.includes('loan') || q.includes('emi') || q.includes('debt')) {
    return `You have ${ctx.loanCount} active loan(s) with a total monthly EMI of ${fmt(ctx.totalEmi)}. Your debt strategy is set to "${ctx.strategy}". ${ctx.strategy === 'avalanche' ? 'This is the mathematically optimal strategy to minimize interest paid.' : 'This builds momentum by clearing small loans first.'}`
  }
  if (q.includes('spend') || q.includes('expense')) {
    return `Your unnecessary spends total ${fmt(ctx.totalSpends)}. That's ${ctx.totalIncome > 0 ? ((ctx.totalSpends / ctx.totalIncome) * 100).toFixed(1) + '% of your income.' : 'a significant amount.'} Try tracking categories to spot patterns.`
  }
  if (q.includes('income')) {
    return `Your total recorded income is ${fmt(ctx.totalIncome)}. Your EMI-to-income ratio is ${ctx.totalIncome > 0 ? ((ctx.totalEmi / ctx.totalIncome) * 100).toFixed(1) + '%' : 'N/A'}. ${ctx.totalEmi / (ctx.totalIncome || 1) > 0.4 ? '⚠️ This is above the recommended 40%.' : '✅ This looks healthy.'}`
  }
  if (q.includes('tip') || q.includes('advice') || q.includes('suggest')) {
    const tips = [
      `Your net savings are ${fmt(ctx.netSavings)}. ${ctx.netSavings > 0 ? 'Consider investing the surplus in index funds.' : 'Cut discretionary spending first.'}`,
      `You're using the ${ctx.strategy} strategy. ${ctx.strategy === 'snowball' ? 'Switching to avalanche could save you more interest.' : "You're already on the optimal path!"}`,
      `With ${fmt(ctx.totalSpends)} in unnecessary spends, even cutting 20% saves ${fmt(ctx.totalSpends * 0.2)}/period.`,
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hi ${PROFILE.displayName}! 👋 I'm your AI finance buddy. Ask me about your savings, loans, income, or spending habits!`
  }
  return `I can help you with insights on your savings, EMI loans, income, and spending. Try asking: "How are my savings?", "Analyse my loans", or "Give me a tip".`
}

export default function AiBuddyPage() {
  const { incomes, loans, spends, strategy } = useFinanceStore()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hey ${PROFILE.displayName}! 👋 I'm your AI finance buddy. Ask me anything about your finances!` }
  ])
  const [input, setInput] = useState('')

  const ctx = {
    totalIncome: incomes.reduce((s, i) => s + i.amount, 0),
    totalEmi: loans.filter(l => l.isActive).reduce((s, l) => s + l.monthlyEmi, 0),
    totalSpends: spends.reduce((s, sp) => s + sp.amount, 0),
    get netSavings() { return this.totalIncome - this.totalEmi - this.totalSpends },
    loanCount: loans.filter(l => l.isActive).length,
    strategy,
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', text: input.trim() }
    const aiMsg: Message = { role: 'ai', text: generateResponse(input.trim(), ctx) }
    setMessages(m => [...m, userMsg, aiMsg])
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
          <Bot size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800">AI Buddy</h1>
          <p className="text-xs text-slate-400">Your personal finance advisor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-auto">
        <input
          className="input flex-1"
          placeholder="Ask about your finances..."
          title="Ask AI Buddy a question about your finances"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3 py-2" disabled={!input.trim()} title="Send message to AI Buddy" aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
