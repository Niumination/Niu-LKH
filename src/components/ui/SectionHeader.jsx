/**
 * SectionHeader — consistent section title with icon and description.
 * @param {{icon: React.ComponentType, title: string, description?: string, extra?: React.ReactNode}} props
 */
export default function SectionHeader({ icon: Icon, title, description, extra }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          {title}
        </h3>
        {description ? <p className="text-xs text-slate-400 mt-1">{description}</p> : null}
      </div>
      {extra}
    </div>
  )
}
