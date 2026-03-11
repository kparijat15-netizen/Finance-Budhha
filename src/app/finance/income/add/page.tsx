'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '../../../../store/financeStore'
import { incomeEntrySchema } from '../../../../types/finance'

function newId() { return Math.random().toString(36).slice(2) }

export default function AddIncomePage() {
  const router = useRouter()
  const { addIncome } = useFinanceStore()
  const [form, setForm] = useState({ source: 'salary', amount: '', receivedAt: new Date().toISOString().slice(0, 10), note: '' })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = incomeEntrySchema.safeParse({
      id: newId(),
      source: form.source,
      amount: Number(form.amount),
      receivedAt: new Date(form.receivedAt).toISOString(),
      note: form.note || undefined,
    })
    if (!result.success) { setError(result.error.issues[0].message); return }
    addIncome(result.data)
    router.push('/finance/income')
  }

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-xl font-bold text-slate-800">Add Income</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="source">Source</label>
          <select id="source" className="input" title="Select income source" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
            <option value="salary">Salary</option>
            <option value="bonus">Bonus</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="amount">Amount (₹)</label>
          <input id="amount" className="input" type="number" min="0" step="0.01" placeholder="50000" title="Enter income amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
        </div>
        <div>
          <label className="label" htmlFor="received-date">Date received</label>
          <input id="received-date" className="input" type="date" title="Select the date you received this income" value={form.receivedAt} onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" type="text" maxLength={240} placeholder="March salary" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
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
