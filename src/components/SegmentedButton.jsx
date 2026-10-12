import { Check } from './icons'

// Segmented button của Material Design 3: ô được chọn có nền secondary-container + dấu ✓.
export default function SegmentedButton({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="group">
      {options.map((o) => {
        const selected = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.key)}
            className="state"
          >
            {selected ? <Check size={16} /> : o.icon ? <o.icon size={16} /> : null}
            <span className="truncate">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
