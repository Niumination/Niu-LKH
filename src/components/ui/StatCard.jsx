import Card from './Card'

/**
 * StatCard — stat box used on Dashboard and Stats.
 * @param {{icon: React.ComponentType, value: string|number, suffix?: string, label: string, color: string, 'aria-label'?: string}} props
 */
export default function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  color,
  'aria-label': ariaLabel,
  title,
}) {
  return (
    <Card as="article" className="hover:border-cyan-500/30 transition-all">
      <div className="p-4 lg:p-5" aria-label={ariaLabel || `${label}: ${value}`} title={title}>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <p className="text-2xl lg:text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix ? <span className="text-sm text-slate-400 font-normal"> {suffix}</span> : null}
        </p>
        <p className="text-xs text-slate-400 mt-1">{label}</p>
      </div>
    </Card>
  )
}
