import { useEffect, useState } from 'react'

function computeIsDark() {
  return document.documentElement.classList.contains('dark')
}

// Trả về true/false theo theme hiện tại — dùng cho các chỗ cần màu literal
// (vd: thuộc tính fill/stroke trong SVG của Recharts, nơi rgb(var(...)) đôi khi
// không được trình duyệt resolve đúng và fallback về đen).
export function useIsDark() {
  const [isDark, setIsDark] = useState(computeIsDark)

  useEffect(() => {
    const update = () => setIsDark(computeIsDark())
    window.addEventListener('themechange', update)
    return () => window.removeEventListener('themechange', update)
  }, [])

  return isDark
}
