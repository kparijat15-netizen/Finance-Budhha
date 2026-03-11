interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'green' | 'red' | 'blue' | 'amber'
  icon?: React.ReactNode
}

const ACCENT_CLASSES = {
  green: 'text-emerald-600',
  red:   'text-red-500',
  blue:  'text-blue-600',
  amber: 'text-amber-500',
}

export default function StatCard({ label, value, sub, accent = 'green', icon }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${ACCENT_CLASSES[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
