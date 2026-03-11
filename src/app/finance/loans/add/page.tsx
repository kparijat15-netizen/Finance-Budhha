'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '../../../../store/financeStore'
import { emiLoanSchema } from '../../../../types/finance'

function newId() { return Math.random().toString(36).slice(2) }

export default function AddLoanPage() {
  const router = useRouter()
  const { addLoan } = useFinanceStore()
  const [form, setForm] = useState({
    lenderName: '', label: '', principalOutstanding: '',
    annualInterestRate: '', monthlyEmi: '', dueDayOfMonth: '1', openedOn: '',
  })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = emiLoanSchema.safeParse({
      id: newId(),
      lenderName: form.lenderName,
      label: form.label,
      principalOutstanding: Number(form.principalOutstanding),
      annualInterestRate: Number(form.annualInterestRate),
      monthlyEmi: Number(form.monthlyEmi),
      dueDayOfMonth: Number(form.dueDayOfMonth),
      openedOn: form.openedOn || undefined,
      isActive: true,
    })
    if (!result.success) { setError(result.error.issues[0].message); return }
    addLoan(result.data)
    router.push('/finance/loans')
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-xl font-bold text-slate-800">Add Loan</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="lender-name">Lender name</label>
          <input id="lender-name" className="input" placeholder="HDFC Bank" title="Enter lender name" value={form.lenderName} onChange={set('lenderName')} required />
        </div>
        <div>
          <label className="label" htmlFor="loan-label">Loan label</label>
          <input id="loan-label" className="input" placeholder="Home loan" title="Enter loan description" value={form.label} onChange={set('label')} required />
        </div>
        <div>
          <label className="label" htmlFor="principal">Principal outstanding (₹)</label>
          <input id="principal" className="input" type="number" min="0" step="0.01" placeholder="1500000" title="Enter principal amount" value={form.principalOutstanding} onChange={set('principalOutstanding')} required />
        </div>
        <div>
          <label className="label" htmlFor="interest-rate">Annual interest rate (%)</label>
          <input id="interest-rate" className="input" type="number" min="0" max="100" step="0.01" placeholder="8.5" title="Enter interest rate" value={form.annualInterestRate} onChange={set('annualInterestRate')} required />
        </div>
        <div>
          <label className="label" htmlFor="emi">Monthly EMI (₹)</label>
          <input id="emi" className="input" type="number" min="0" step="0.01" placeholder="15000" title="Enter monthly EMI amount" value={form.monthlyEmi} onChange={set('monthlyEmi')} required />
        </div>
        <div>
          <label className="label" htmlFor="due-day">Due day of month</label>
          <input id="due-day" className="input" type="number" min="1" max="31" title="Enter due day (1-31)" value={form.dueDayOfMonth} onChange={set('dueDayOfMonth')} required />
        </div>
        <div>
          <label className="label" htmlFor="opened-date">Opened on (optional)</label>
          <input id="opened-date" className="input" type="date" title="When was this loan opened" value={form.openedOn} onChange={set('openedOn')} />
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
