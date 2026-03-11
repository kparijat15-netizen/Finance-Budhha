'use client'
import { useState, useEffect } from 'react'
import { useGoalsStore } from '../../store/goalsStore'
import { smokingCessationGoalSchema, dietGoalSchema } from '../../types/goals'
import { Cigarette, Salad, TimerReset } from 'lucide-react'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function pad(n: number) { return String(n).padStart(2, '0') }

function elapsedText(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${pad(h % 24)}h ${pad(m % 60)}m`
  return `${pad(h)}h ${pad(m % 60)}m ${pad(s % 60)}s`
}

export default function GoalsPage() {
  const { smokingGoal, setSmokingGoal, clearSmokingGoal, dietGoal, setDietGoal, clearDietGoal } = useGoalsStore()
  const [tick, setTick] = useState(0)
  const [showSmokingForm, setShowSmokingForm] = useState(false)
  const [showDietForm, setShowDietForm] = useState(false)

  // Smoking form state
  const [lastSmoke, setLastSmoke] = useState(new Date().toISOString().slice(0, 16))
  const [cpd, setCpd] = useState('10')
  const [ppc, setPpc] = useState('0.5')

  // Diet form state
  const [targetCal, setTargetCal] = useState('2000')
  const [consumedCal, setConsumedCal] = useState('0')
  const [protein, setProtein] = useState('0')
  const [carbs, setCarbs] = useState('0')
  const [fats, setFats] = useState('0')
  const [targetProtein, setTargetProtein] = useState('120')
  const [targetCarbs, setTargetCarbs] = useState('200')
  const [targetFats, setTargetFats] = useState('65')

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const smokingMs = smokingGoal ? Date.now() - new Date(smokingGoal.lastSmokeAt).getTime() : 0
  const cigAvoided = smokingGoal ? Math.floor((smokingMs / 3600000) * (smokingGoal.baselineCigarettesPerDay / 24)) : 0
  const moneySaved = smokingGoal ? cigAvoided * smokingGoal.pricePerCigarette : 0

  function saveSmokingGoal(e: React.FormEvent) {
    e.preventDefault()
    const result = smokingCessationGoalSchema.safeParse({
      lastSmokeAt: new Date(lastSmoke).toISOString(),
      baselineCigarettesPerDay: Number(cpd),
      pricePerCigarette: Number(ppc),
    })
    if (result.success) { setSmokingGoal(result.data); setShowSmokingForm(false) }
  }

  function saveDietGoal(e: React.FormEvent) {
    e.preventDefault()
    const result = dietGoalSchema.safeParse({
      targetCalories: Number(targetCal),
      consumedCalories: Number(consumedCal),
      targetMacros: { proteinGrams: Number(targetProtein), carbsGrams: Number(targetCarbs), fatsGrams: Number(targetFats) },
      consumedMacros: { proteinGrams: Number(protein), carbsGrams: Number(carbs), fatsGrams: Number(fats) },
    })
    if (result.success) { setDietGoal(result.data); setShowDietForm(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Goals</h1>

      {/* Smoking Cessation */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Cigarette size={16} /> Smoking Cessation</h2>
          {smokingGoal
            ? <button onClick={clearSmokingGoal} className="text-xs text-red-400 hover:underline">Reset</button>
            : <button onClick={() => setShowSmokingForm(v => !v)} className="btn-primary text-sm">Set goal</button>
          }
        </div>

        {showSmokingForm && !smokingGoal && (
          <form onSubmit={saveSmokingGoal} className="card space-y-3">
            <div><label className="label" htmlFor="last-smoke">Last cigarette (date & time)</label><input id="last-smoke" className="input" type="datetime-local" title="Select when you had your last cigarette" value={lastSmoke} onChange={e => setLastSmoke(e.target.value)} required /></div>
            <div><label className="label" htmlFor="cpd">Cigarettes per day (baseline)</label><input id="cpd" className="input" type="number" min="1" title="How many cigarettes per day baseline" value={cpd} onChange={e => setCpd(e.target.value)} required /></div>
            <div><label className="label" htmlFor="ppc">Price per cigarette (₹)</label><input id="ppc" className="input" type="number" min="0" step="0.01" title="Price per cigarette for savings calculation" value={ppc} onChange={e => setPpc(e.target.value)} required /></div>
            <div className="flex gap-2"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" className="btn-secondary flex-1" onClick={() => setShowSmokingForm(false)}>Cancel</button></div>
          </form>
        )}

        {smokingGoal && (
          <div className="card space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-600 font-mono">{elapsedText(smokingMs)}</div>
              <div className="text-xs text-slate-400 mt-1">smoke-free</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400">Cigarettes avoided</div>
                <div className="font-bold text-emerald-600 text-lg">{cigAvoided}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400">Money saved</div>
                <div className="font-bold text-emerald-600 text-lg">{fmt(moneySaved)}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Diet Goal */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Salad size={16} /> Diet Today</h2>
          {dietGoal
            ? <button onClick={clearDietGoal} className="text-xs text-red-400 hover:underline">Reset</button>
            : <button onClick={() => setShowDietForm(v => !v)} className="btn-primary text-sm">Set goal</button>
          }
        </div>

        {showDietForm && !dietGoal && (
          <form onSubmit={saveDietGoal} className="card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="target-cal">Target calories</label><input id="target-cal" className="input" type="number" min="0" title="Target daily calories" value={targetCal} onChange={e => setTargetCal(e.target.value)} /></div>
              <div><label className="label" htmlFor="consumed-cal">Consumed calories</label><input id="consumed-cal" className="input" type="number" min="0" title="Calories consumed today" value={consumedCal} onChange={e => setConsumedCal(e.target.value)} /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Target macros (g)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="label" htmlFor="target-protein">Protein</label><input id="target-protein" className="input" type="number" min="0" title="Target protein grams" value={targetProtein} onChange={e => setTargetProtein(e.target.value)} /></div>
              <div><label className="label" htmlFor="target-carbs">Carbs</label><input id="target-carbs" className="input" type="number" min="0" title="Target carbs grams" value={targetCarbs} onChange={e => setTargetCarbs(e.target.value)} /></div>
              <div><label className="label" htmlFor="target-fats">Fats</label><input id="target-fats" className="input" type="number" min="0" title="Target fats grams" value={targetFats} onChange={e => setTargetFats(e.target.value)} /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Consumed macros (g)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="label" htmlFor="consumed-protein">Protein</label><input id="consumed-protein" className="input" type="number" min="0" title="Protein consumed" value={protein} onChange={e => setProtein(e.target.value)} /></div>
              <div><label className="label" htmlFor="consumed-carbs">Carbs</label><input id="consumed-carbs" className="input" type="number" min="0" title="Carbs consumed" value={carbs} onChange={e => setCarbs(e.target.value)} /></div>
              <div><label className="label" htmlFor="consumed-fats">Fats</label><input id="consumed-fats" className="input" type="number" min="0" title="Fats consumed" value={fats} onChange={e => setFats(e.target.value)} /></div>
            </div>
            <div className="flex gap-2"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" className="btn-secondary flex-1" onClick={() => setShowDietForm(false)}>Cancel</button></div>
          </form>
        )}

        {dietGoal && (
          <div className="card space-y-3">
            {/* Calorie progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Calories</span>
                <span>{dietGoal.consumedCalories} / {dietGoal.targetCalories} kcal</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(100, (dietGoal.consumedCalories / (dietGoal.targetCalories || 1)) * 100)}%` }} />
              </div>
            </div>
            {/* Macros */}
            {(['protein', 'carbs', 'fats'] as const).map(macro => {
              const consumed = dietGoal.consumedMacros[`${macro}Grams`]
              const target = dietGoal.targetMacros[`${macro}Grams`]
              return (
                <div key={macro}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="capitalize">{macro}</span>
                    <span>{consumed}g / {target}g</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, (consumed / (target || 1)) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
