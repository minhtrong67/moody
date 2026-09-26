import { useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const THRESHOLD = 76
const MAX_DRAG = 128

// Vuốt phải = sửa (mở ngay), vuốt trái = xóa (thực hiện ngay).
// Không hỏi xác nhận trước — phản hồi (toast) hiển thị SAU khi thao tác hoàn tất.
export default function SwipeableRow({ onEdit, onDelete, children }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [settling, setSettling] = useState(false)
  const startXRef = useRef(0)

  function handlePointerDown(e) {
    setDragging(true)
    setSettling(false)
    startXRef.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    const dx = e.clientX - startXRef.current
    // Độ cản nhẹ khi kéo quá xa để cảm giác mượt & có giới hạn.
    const eased = Math.sign(dx) * MAX_DRAG * (1 - Math.exp(-Math.abs(dx) / MAX_DRAG))
    setDragX(eased)
  }

  function endDrag() {
    if (!dragging) return
    setDragging(false)
    setSettling(true)
    if (dragX > THRESHOLD) {
      setDragX(0)
      onEdit()
    } else if (dragX < -THRESHOLD) {
      setDragX(0)
      onDelete()
    } else {
      setDragX(0)
    }
  }

  const revealRight = dragX < 0 ? Math.min(1, -dragX / THRESHOLD) : 0
  const revealLeft = dragX > 0 ? Math.min(1, dragX / THRESHOLD) : 0

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex">
        <div
          className="h-full flex items-center pl-5 gap-2 text-oncolor bg-primary"
          style={{ width: '50%', opacity: revealLeft, transform: `scale(${0.9 + revealLeft * 0.1})`, transformOrigin: 'left center' }}
        >
          <Pencil size={18} strokeWidth={2.2} />
          <span className="text-xs font-medium">Sửa</span>
        </div>
        <div
          className="h-full flex items-center justify-end pr-5 gap-2 text-oncolor bg-mood-angry ml-auto"
          style={{ width: '50%', opacity: revealRight, transform: `scale(${0.9 + revealRight * 0.1})`, transformOrigin: 'right center' }}
        >
          <span className="text-xs font-medium">Xóa</span>
          <Trash2 size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y'
        }}
        className="relative bg-surface"
        onTransitionEnd={() => setSettling(false)}
      >
        {children}
      </div>
    </div>
  )
}
