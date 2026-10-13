import { memo, useRef } from 'react'
import { Pencil, Trash2 } from './icons'
import { useI18n } from '../i18n'

const THRESHOLD = 76
const MAX_DRAG = 128
const START_SLOP = 6

// Vuốt phải = sửa, vuốt trái = xóa (thực hiện ngay, phản hồi bằng snackbar sau khi xong).
// Hiệu năng: khi kéo chỉ ghi trực tiếp vào style (transform/opacity) qua ref — KHÔNG setState theo
// từng pointermove nên không re-render React, giữ 60fps ngay cả trên máy yếu.
function SwipeableRow({ onEdit, onDelete, children }) {
  const { t } = useI18n()
  const rowRef = useRef(null)
  const editRef = useRef(null)
  const deleteRef = useRef(null)
  const state = useRef({ down: false, dragging: false, startX: 0, startY: 0, dx: 0 })

  function paint(x, animate) {
    const row = rowRef.current
    if (!row) return
    row.style.transition = animate ? 'transform 0.32s cubic-bezier(0.05, 0.7, 0.1, 1)' : 'none'
    row.style.transform = x ? `translate3d(${x}px,0,0)` : ''
    const left = x > 0 ? Math.min(1, x / THRESHOLD) : 0
    const right = x < 0 ? Math.min(1, -x / THRESHOLD) : 0
    if (editRef.current) {
      editRef.current.style.opacity = left
      editRef.current.style.transform = `scale(${0.9 + left * 0.1})`
    }
    if (deleteRef.current) {
      deleteRef.current.style.opacity = right
      deleteRef.current.style.transform = `scale(${0.9 + right * 0.1})`
    }
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    Object.assign(state.current, { down: true, dragging: false, startX: e.clientX, startY: e.clientY, dx: 0 })
  }

  function onPointerMove(e) {
    const s = state.current
    if (!s.down) return
    const dx = e.clientX - s.startX
    if (!s.dragging) {
      // Chỉ coi là vuốt ngang khi di chuyển đủ xa và chủ yếu theo chiều ngang.
      if (Math.abs(dx) < START_SLOP || Math.abs(dx) < Math.abs(e.clientY - s.startY)) return
      s.dragging = true
      rowRef.current?.setPointerCapture(e.pointerId)
    }
    // Độ cản nhẹ khi kéo quá xa để cảm giác mượt & có giới hạn.
    s.dx = Math.sign(dx) * MAX_DRAG * (1 - Math.exp(-Math.abs(dx) / MAX_DRAG))
    paint(s.dx, false)
  }

  function endDrag() {
    const s = state.current
    if (!s.down) return
    const { dragging, dx } = s
    s.down = false
    s.dragging = false
    if (!dragging) return
    paint(0, true)
    if (dx > THRESHOLD) onEdit()
    else if (dx < -THRESHOLD) onDelete()
  }

  return (
    <div className="relative overflow-hidden rounded-m3-md">
      <div className="absolute inset-0 flex" aria-hidden="true">
        <div
          ref={editRef}
          className="h-full flex items-center pl-5 gap-2 text-on-primary bg-primary opacity-0"
          style={{ width: '50%', transformOrigin: 'left center' }}
        >
          <Pencil size={24} />
          <span className="t-label-large">{t('common.edit')}</span>
        </div>
        <div
          ref={deleteRef}
          className="h-full flex items-center justify-end pr-5 gap-2 text-on-error bg-error ml-auto opacity-0"
          style={{ width: '50%', transformOrigin: 'right center' }}
        >
          <span className="t-label-large">{t('common.delete')}</span>
          <Trash2 size={24} />
        </div>
      </div>

      <div
        ref={rowRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: 'pan-y' }}
        className="relative will-change-transform"
      >
        {children}
      </div>
    </div>
  )
}

export default memo(SwipeableRow)
