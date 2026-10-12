import { forwardRef } from 'react'
import { ChevronDown } from './icons'

// Outlined text field của Material Design 3 (nhãn nổi lên viền khi focus / có giá trị).
// - as="input" (mặc định) | "textarea" | "select"
// - alwaysFloat: dùng cho select, datetime-local, time… (luôn hiển thị sẵn giá trị)
// - leading: icon đứng đầu
const TextField = forwardRef(function TextField(
  { label, as = 'input', alwaysFloat = false, leading, className = '', fieldBg, children, placeholder, ...props },
  ref
) {
  const Tag = as
  const float = alwaysFloat || as === 'select'
  return (
    <div
      className={`m3-field ${float ? 'is-float' : ''} ${className}`}
      style={fieldBg ? { '--field-bg': fieldBg } : undefined}
    >
      <Tag
        ref={ref}
        placeholder={placeholder ?? ' '}
        className={`m3-input ${leading ? 'has-leading' : ''}`}
        {...props}
      >
        {children}
      </Tag>
      <label>{label}</label>
      {as === 'select' && <ChevronDown size={24} className="field-icon" style={{ right: 12 }} />}
    </div>
  )
})

export default TextField
