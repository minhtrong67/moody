import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  List,
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  Clock3,
} from "lucide-react";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
import { useToast } from "../context/ToastContext";
import { daysInMonth, relativeDateLabel } from "../lib/dateUtils";
import SwipeableRow from "../components/SwipeableRow";
import ConfirmDialog from "../components/ConfirmDialog";

const PERIOD_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

const SORT_OPTIONS = [
  { key: "date_desc", label: "Mới nhất" },
  { key: "date_asc", label: "Cũ nhất" },
  { key: "score_desc", label: "Mood cao → thấp" },
  { key: "score_asc", label: "Mood thấp → cao" },
];

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export default function History() {
  const { entries, deleteEntry } = useMoodEntries();
  const { activities } = useActivities();
  const { moodByKey, moods } = useMoods();
  const [view, setView] = useState("list");

  const activityById = useMemo(
    () => Object.fromEntries(activities.map((a) => [a.id, a])),
    [activities],
  );

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto page-enter">
      <h1 className="font-display text-2xl mb-4">Lịch sử check-in</h1>

      <div className="flex gap-2 mb-5 border border-line rounded-full p-1 bg-line/15">
        <button
          onClick={() => setView("list")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm transition-colors ${view === "list" ? "bg-primary text-oncolor" : "text-inkmuted"}`}
        >
          <List size={16} /> Danh sách
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm transition-colors ${view === "calendar" ? "bg-primary text-oncolor" : "text-inkmuted"}`}
        >
          <CalendarIcon size={16} /> Lịch
        </button>
      </div>

      {view === "list" ? (
        <ListView
          entries={entries}
          deleteEntry={deleteEntry}
          activityById={activityById}
          moodByKey={moodByKey}
          moods={moods}
        />
      ) : (
        <CalendarView
          entries={entries}
          activityById={activityById}
          moodByKey={moodByKey}
        />
      )}
    </div>
  );
}

function ListView({ entries, deleteEntry, activityById, moodByKey, moods }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("all");
  const [moodFilter, setMoodFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (period !== "all" ? 1 : 0) +
    (moodFilter !== "all" ? 1 : 0) +
    (sort !== "date_desc" ? 1 : 0);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();

    let list = entries.filter((e) => {
      if (moodFilter !== "all" && e.mood !== moodFilter) return false;
      if (period !== "all") {
        const d = new Date(e.date);
        if (period === "week") {
          const diffDays = (now - d) / 86400000;
          if (!(diffDays >= 0 && diffDays < 7)) return false;
        }
        if (
          period === "month" &&
          !(
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          )
        ) {
          return false;
        }
      }
      if (q) {
        const activityLabels = (e.activities || [])
          .map((id) => activityById[id]?.label || "")
          .join(" ");
        const haystack = `${e.note || ""} ${activityLabels}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = list.sort((a, b) => {
      if (sort === "date_desc")
        return a.date === b.date
          ? a.time < b.time
            ? 1
            : -1
          : a.date < b.date
            ? 1
            : -1;
      if (sort === "date_asc")
        return a.date === b.date
          ? a.time > b.time
            ? 1
            : -1
          : a.date > b.date
            ? 1
            : -1;
      if (sort === "score_desc") return b.score - a.score;
      if (sort === "score_asc") return a.score - b.score;
      return 0;
    });

    return list;
  }, [entries, moodFilter, period, search, sort, activityById]);

  const [pendingDelete, setPendingDelete] = useState(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa bản ghi này?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-inkmuted"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo ghi chú hoặc hoạt động…"
          className="w-full border border-line rounded-full pl-10 pr-4 py-2.5 text-sm bg-transparent focus:outline-none focus:border-accent"
        />
      </div>

      <div className="border border-line rounded-lg mb-4 overflow-hidden bg-surface">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3"
        >
          <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <SlidersHorizontal size={14} strokeWidth={2} />
          </span>
          <span className="flex-1 text-left text-sm font-medium">
            Bộ lọc & sắp xếp
          </span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-oncolor text-[10px] flex items-center justify-center shrink-0">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-inkmuted shrink-0 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
          />
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-line pop-in space-y-3">
            <div>
              <label className="block text-[11px] text-inkmuted mb-1.5 mt-3">
                Khoảng thời gian
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface"
              >
                {PERIOD_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-inkmuted mb-1.5">
                Cảm xúc
              </label>
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface"
              >
                <option value="all">Mọi cảm xúc</option>
                {moods.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-inkmuted mb-1.5">
                Sắp xếp theo
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-inkmuted mb-3">
        {filtered.length} bản ghi · vuốt để sửa hoặc xóa
      </p>

      {filtered.length === 0 ? (
        <p className="text-inkmuted text-sm text-center py-16">
          Không tìm thấy bản ghi phù hợp.
        </p>
      ) : (
        <ul className="space-y-2.5 pb-4">
          {filtered.map((e, idx) => {
            const m = moodByKey(e.mood);
            const time = e.time ? new Date(e.time) : null;
            return (
              <li
                key={e.id}
                className="pop-in"
                style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
              >
                <SwipeableRow
                  onEdit={() => navigate(`/checkin/${e.id}`)}
                  onDelete={() => setPendingDelete(e)}
                >
                  <div className="border border-line rounded-lg p-3.5 gap-3">
                    <div className="flex items-start gap-4">
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                        style={{ background: m.color + "2E" }}
                      >
                        {m?.emoji}
                      </span>
                      <div className="flex items-start flex-col gap-2">
                        <p className="font-medium leading-tight">{m?.label}</p>
                        <span className="flex items-center gap-1 text-xs text-inkmuted shrink-0">
                          <Clock3 size={11} strokeWidth={2} />
                          {relativeDateLabel(e.date)}
                          {time
                            ? `, ${time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {e.note && (
                        <p className="text-sm text-inkmuted mt-1.5">{e.note}</p>
                      )}
                      {e.activities?.length > 0 && (
                        <div className="grid grid-cols-3 items-center gap-1.5 mt-2">
                          {e.activities.map((id) => {
                            const a = activityById[id];
                            if (!a) return null;
                            return (
                              <span
                                key={id}
                                className="text-xs p-2 rounded-full bg-line/40 text-inkmuted flex items-center justify-center gap-2"
                              >
                                <span className="flex-shrink-0">{a.emoji}</span>
                                {a.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </SwipeableRow>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function CalendarView({ entries, activityById, moodByKey }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { deleteEntry } = useMoodEntries();

  const byDate = useMemo(() => {
    const map = {};
    for (const e of entries)
      if (!map[e.date] || e.time > map[e.date].time) map[e.date] = e;
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const total = daysInMonth(year, month);
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  function isoFor(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function handleDayClick(iso) {
    if (byDate[iso]) setSelected(iso);
    else navigate(`/checkin?date=${iso}`);
  }

  const selectedEntry = selected ? byDate[selected] : null;

  return (
    <div className="pb-4 pop-in">
      <ConfirmDialog
        open={confirmDelete}
        title="Xóa bản ghi này?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={() => {
          deleteEntry(selectedEntry.id);
          setConfirmDelete(false);
          setSelected(null);
          showToast("Đã xóa bản ghi");
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Tháng trước"
          className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-lg">
          {MONTHS_VI[month]} {year}
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Tháng sau"
          className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-xs text-inkmuted text-center mb-4">
        Chạm vào ngày trống để tạo check-in mới
      </p>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs text-inkmuted py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoFor(d);
          const entry = byDate[iso];
          const m = entry ? moodByKey(entry.mood) : null;
          return (
            <button
              key={i}
              onClick={() => handleDayClick(iso)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-base gap-0.5 transition-transform active:scale-90"
              style={{
                background: m ? m.color + "33" : "rgb(var(--c-line) / 0.25)",
                border:
                  selected === iso
                    ? "2px solid rgb(var(--c-accent))"
                    : "1px solid transparent",
              }}
            >
              {m ? (
                <span>{m.emoji}</span>
              ) : (
                <span className="text-xs text-inkmuted">{d}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedEntry && (
        <div className="mt-5 border border-line rounded-lg p-4 pop-in bg-surface">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium">
              {moodByKey(selectedEntry.mood)?.emoji}{" "}
              {moodByKey(selectedEntry.mood)?.label} · {selected}
            </p>
          </div>
          {selectedEntry.note && (
            <p className="text-sm text-inkmuted mb-2">{selectedEntry.note}</p>
          )}
          {selectedEntry.activities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedEntry.activities.map((id) => {
                const a = activityById[id];
                if (!a) return null;
                return (
                  <span
                    key={id}
                    className="text-[11px] px-2 py-1 rounded-full bg-line/40 text-inkmuted flex items-center gap-1"
                  >
                    <span>{a.emoji}</span>
                    {a.label}
                  </span>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate(`/checkin/${selectedEntry.id}`)}
              className="flex items-center justify-center gap-1.5 bg-accent/10 text-accent rounded-lg py-3 text-sm font-medium"
            >
              Sửa
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-1.5 bg-mood-angry/10 text-mood-angry rounded-lg py-3 text-sm font-medium"
            >
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
