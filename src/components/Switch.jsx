import { Check } from './icons'

// Switch của Material Design 3 (52×32, thumb nở khi bật và hiện dấu ✓).
export default function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="m3-switch state"
    >
      <span className="thumb">{checked && <Check size={16} />}</span>
    </button>
  )
}
