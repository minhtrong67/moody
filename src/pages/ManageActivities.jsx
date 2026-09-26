import { useRef, useState } from "react";
import { Plus, Check, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { useActivities } from "../hooks/useActivities";
import { useToast } from "../context/ToastContext";
import SwipeableRow from "../components/SwipeableRow";
import BottomSheet from "../components/BottomSheet";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ManageActivities() {
  const {
    activities,
    addActivity,
    updateActivity,
    removeActivity,
    reorderActivities,
  } = useActivities();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  function openAdd() {
    setEditingId(null);
    setEmoji("");
    setLabel("");
    setFormOpen(true);
  }

  function openEdit(a) {
    setEditingId(a.id);
    setEmoji(a.emoji);
    setLabel(a.label);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function performUpdate() {
    await updateActivity(editingId, {
      emoji: emoji.trim() || "✨",
      label: label.trim(),
    });
    showToast("Đã cập nhật hoạt động");
    setConfirmUpdateOpen(false);
    closeForm();
  }

  async function handleSubmit() {
    if (!label.trim()) return;
    if (editingId) {
      setConfirmUpdateOpen(true);
    } else {
      await addActivity({ emoji: emoji.trim() || "✨", label: label.trim() });
      showToast("Đã thêm hoạt động mới");
      closeForm();
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await removeActivity(pendingDelete.id);
    showToast("Đã xóa hoạt động");
    setPendingDelete(null);
  }

  function handleDragStart(id) {
    dragId.current = id;
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDrop(targetId) {
    const sourceId = dragId.current;
    setDragOverId(null);
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;
    const ids = activities.map((a) => a.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, sourceId);
    reorderActivities(ids);
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= activities.length) return;
    const ids = activities.map((a) => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderActivities(ids);
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmUpdateOpen}
        title="Cập nhật hoạt động này?"
        description="Emoji và tên hiển thị sẽ được thay đổi."
        confirmLabel="Cập nhật"
        onConfirm={performUpdate}
        onCancel={() => setConfirmUpdateOpen(false)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa hoạt động này?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <h1 className="font-display text-2xl mb-1">Quản lý hoạt động</h1>
      <p className="text-inkmuted text-sm mb-6">
        Kéo biểu tượng <GripVertical size={12} className="inline -mt-0.5" /> để
        sắp xếp. Vuốt phải để sửa, vuốt trái để xóa.
      </p>

      <button
        onClick={openAdd}
        className="w-full flex items-center justify-center gap-2 bg-primary text-oncolor rounded-lg py-3 mb-6 font-medium"
      >
        <Plus size={17} strokeWidth={2.2} /> Thêm hoạt động mới
      </button>

      <BottomSheet
        open={formOpen}
        title={editingId ? "Sửa hoạt động" : "Hoạt động mới"}
        onClose={closeForm}
      >
        <div className="flex gap-2 mb-4">
          <div className="w-16 shrink-0">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">
              Emoji
            </label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(-2))}
              placeholder="😀"
              className="w-full h-12 text-center text-xl border border-line rounded-lg bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">
              Tên hoạt động
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="vd: Đọc sách"
              autoFocus
              className="w-full h-12 border border-line rounded-lg px-4 text-sm bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={closeForm}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-3 text-sm"
          >
            <X size={15} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="flex items-center justify-center gap-1.5 bg-primary text-oncolor rounded-full py-3 text-sm disabled:opacity-40"
          >
            <Check size={15} strokeWidth={2.4} />{" "}
            {editingId ? "Cập nhật" : "Lưu"}
          </button>
        </div>
      </BottomSheet>

      <ul className="space-y-2.5">
        {activities.map((a, i) => (
          <li
            key={a.id}
            onDragOver={(e) => handleDragOver(e, a.id)}
            onDrop={() => handleDrop(a.id)}
            className={`transition-opacity ${dragOverId === a.id ? "opacity-60" : ""}`}
          >
            <SwipeableRow
              onEdit={() => openEdit(a)}
              onDelete={() => setPendingDelete(a)}
            >
              <div className="flex items-center gap-3 border border-line rounded-lg p-3 bg-surface">
                <span
                  draggable
                  onDragStart={() => handleDragStart(a.id)}
                  className="text-inkmuted cursor-grab active:cursor-grabbing shrink-0 touch-none"
                  aria-label="Kéo để sắp xếp"
                >
                  <GripVertical size={16} strokeWidth={2} />
                </span>
                <span className="w-10 h-10 rounded-full bg-line/25 flex items-center justify-center text-lg shrink-0">
                  {a.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.label}</p>
                  <p className="text-[11px] text-inkmuted">
                    {a.custom ? "Tự tạo" : "Mặc định"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Di chuyển lên"
                    className="w-10 h-10 rounded-full bg-line/25 text-inkmuted flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowUp size={18} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === activities.length - 1}
                    aria-label="Di chuyển xuống"
                    className="w-10 h-10 rounded-full bg-line/25 text-inkmuted flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowDown size={18} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </SwipeableRow>
          </li>
        ))}
      </ul>
    </div>
  );
}
