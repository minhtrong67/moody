import { useCallback, useEffect, useRef, useState } from 'react'

// useState có ghi nhớ vào sessionStorage: chuyển trang rồi quay lại vẫn giữ nguyên bộ lọc,
// đóng tab / thoát phiên thì tự xóa. Giá trị phải serialize được thành JSON.
// `revive` (tùy chọn) chuyển giá trị đã lưu về kiểu gốc (vd: chuỗi ISO → Date) và có thể trả
// undefined để bỏ giá trị hỏng.
const PREFIX = 'moody:'

export function useSessionState(key, initial, { revive } = {}) {
  const fullKey = PREFIX + key
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(fullKey)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        const v = revive ? revive(parsed) : parsed
        if (v !== undefined) return v
      }
    } catch {
      /* sessionStorage bị chặn / dữ liệu hỏng → dùng giá trị mặc định */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      sessionStorage.setItem(fullKey, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  }, [fullKey, value])

  const reset = useCallback(() => {
    setValue(typeof initial === 'function' ? initial() : initial)
  }, [initial])

  return [value, setValue, reset]
}

// Date <-> chuỗi ISO (Date được JSON.stringify thành chuỗi ISO sẵn).
export const reviveDate = (v) => {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}
