'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '../../../../store/financeStore'
import { unnecessarySpendSchema } from '../../../../types/finance'

function newId() { return Math.random().toString(36).slice(2) }

export default function AddSpendPage() {
  const router = useRouter()
  const { addSpend } = useFinanceStore()
  const [form, setForm] = useState({ category: '', amount: '', spentAt: new Date().toISOString().slice(0, 10), merchant: '', memo: '' })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = unnecessarySpendSchema.safeParse({
      id: newId(),
      category: form.category,
      amount: Number(form.amount),
      spentAt: new Date(form.spentAt).toISOString(),
      merchant: form.merchant || undefined,
      memo: form.memo || undefined,
    })
    if (!result.success) { setError(result.error.issues[0].message); return }
    addSpend(result.data)
    router.push('/finance/spends')
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-xl font-bold text-slate-800">Log Unnecessary Spend</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="category">Category</label>
          <input id="category" className="input" placeholder="Eating out, Shopping..." title="Enter spend category" value={form.category} onChange={set('category')} required />
        </div>
        <div>
          <label className="label" htmlFor="amount">Amount (₹)</label>
          <input id="amount" className="input" type="number" min="0" step="0.01" placeholder="500" title="Enter spend amount" value={form.amount} onChange={set('amount')} required />
        </div>
        <div>
          <label className="label" htmlFor="spent-date">Date</label>
          <input id="spent-date" className="input" type="date" title="Select the date of expense" value={form.spentAt} onChange={set('spentAt')} required />
        </div>
        <div>
          <label className="label" htmlFor="merchant">Merchant (optional)</label>
          <input id="merchant" className="input" placeholder="Zomato" title="Enter merchant name" value={form.merchant} onChange={set('merchant')} />
        </div>
        <div>
          <label className="label">Memo (optional)</label>
          <input className="input" placeholder="Impulse buy" value={form.memo} onChange={set('memo')} />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1">Save</button>
          <button type="button" className="btn-secondary flex-1" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
