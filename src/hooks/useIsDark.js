import { useEffect, useState } from 'react'
import { isDarkNow, readRole } from '../lib/theme'

// Trả về true/false theo theme hiện tại.
export function useIsDark() {
  const [isDark, setIsDark] = useState(isDarkNow)
  useEffect(() => {
    const update = () => setIsDark(isDarkNow())
    window.addEventListener('themechange', update)
    return () => window.removeEventListener('themechange', update)
  }, [])
  return isDark
}

// Màu literal (#hex) của các color role đang áp dụng — dùng cho SVG của Recharts, nơi
// `rgb(var(--x))` đôi khi không được trình duyệt resolve. Tự cập nhật khi đổi sáng/tối/màu chủ đề.
export function useThemeColors() {
  const read = () => ({
    ink: readRole('on-surface'),
    muted: readRole('on-surface-variant'),
    line: readRole('outline-variant'),
    surface: readRole('surface-container-high'),
    accent: readRole('primary'),
    secondary: readRole('secondary')
  })
  const [colors, setColors] = useState(read)
  useEffect(() => {
    const update = () => setColors(read())
    window.addEventListener('themechange', update)
    return () => window.removeEventListener('themechange', update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return colors
}
