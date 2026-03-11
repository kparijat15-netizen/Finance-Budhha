'use client'
import { useFinanceStore } from '../../../store/financeStore'
import { useRouter } from 'next/navigation'

export default function StrategyPage() {
  const { strategy, setStrategy } = useFinanceStore()
  const router = useRouter()

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-xl font-bold text-slate-800">Debt Strategy</h1>
      <div className="space-y-3">
        {(['avalanche', 'snowball'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStrategy(s); router.push('/finance') }}
            className={`card w-full text-left transition-all ${strategy === s ? 'ring-2 ring-brand-500' : ''}`}
          >
            <div className="font-semibold text-slate-800 capitalize">{s}</div>
            <div className="text-xs text-slate-400 mt-1">
              {s === 'avalanche'
                ? 'Pay off highest interest rate loans first. Saves the most money overall.'
                : 'Pay off smallest balance loans first. Builds momentum with quick wins.'}
            </div>
            {strategy === s && <div className="mt-2 text-xs text-brand-600 font-medium">✓ Currently active</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
