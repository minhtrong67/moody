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
} from "../components/icons";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
import { useToast } from "../context/ToastContext";
import { daysInMonth, relativeDateLabel } from "../lib/dateUtils";
import SwipeableRow from "../components/SwipeableRow";
import SegmentedButton from "../components/SegmentedButton";
import TextField from "../components/TextField";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  EntryListSkeleton,
  CalendarSkeleton,
} from "../components/PageSkeleton";

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
  const { entries, loading: entriesLoading, deleteEntry } = useMoodEntries();
  const { activities, loading: activitiesLoading } = useActivities();
  const { moodByKey, moods, loading: moodsLoading } = useMoods();
  const loading = entriesLoading || activitiesLoading || moodsLoading;
  const [view, setView] = useState("list");

  const activityById = useMemo(
    () => Object.fromEntries(activities.map((a) => [a.id, a])),
    [activities],
  );

  return (
    <div className="px-4 pt-2 max-w-lg mx-auto page-enter">
      <h1 className="t-headline-medium mb-4">Lịch sử check-in</h1>

      <SegmentedButton
        className="mb-5"
        value={view}
        onChange={setView}
        options={[
          { key: "list", label: "Danh sách", icon: List },
          { key: "calendar", label: "Lịch", icon: CalendarIcon },
        ]}
      />

      {view === "list" ? (
        <ListView
          loading={loading}
          entries={entries}
          deleteEntry={deleteEntry}
          activityById={activityById}
          moodByKey={moodByKey}
          moods={moods}
        />
      ) : (
        <CalendarView
          loading={loading}
          entries={entries}
          activityById={activityById}
          moodByKey={moodByKey}
        />
      )}
    </div>
  );
}

function ListView({
  loading,
  entries,
  deleteEntry,
  activityById,
  moodByKey,
  moods,
}) {
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

      {/* Search bar */}
      <div className="relative mb-3">
        <Search
          size={24}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo ghi chú hoặc hoạt động…"
          aria-label="Tìm kiếm"
          className="w-full h-14 rounded-full bg-surface-container-high pl-14 pr-4 t-body-large focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="card-filled mb-4 overflow-hidden">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="state w-full flex items-center gap-4 px-4 h-14"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal size={24} className="text-on-surface-variant shrink-0" />
          <span className="flex-1 text-left t-title-small">
            Bộ lọc & sắp xếp
          </span>
          {activeFilterCount > 0 && (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-primary text-on-primary t-label-small flex items-center justify-center shrink-0">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={24}
            className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
          />
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 pt-3 pop-in space-y-4">
            <TextField
              as="select"
              label="Khoảng thời gian"
              fieldBg="var(--md-surface-container-highest)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </TextField>

            <TextField
              as="select"
              label="Cảm xúc"
              fieldBg="var(--md-surface-container-highest)"
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
            >
              <option value="all">Mọi cảm xúc</option>
              {moods.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </TextField>

            <TextField
              as="select"
              label="Sắp xếp theo"
              fieldBg="var(--md-surface-container-highest)"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </TextField>
          </div>
        )}
      </div>

      <p className="t-body-small text-on-surface-variant mb-3 px-1">
        {loading
          ? "Đang tải…"
          : `${filtered.length} bản ghi · vuốt để sửa hoặc xóa`}
      </p>

      {loading ? (
        <EntryListSkeleton />
      ) : filtered.length === 0 ? (
        <p className="t-body-medium text-on-surface-variant text-center py-16">
          Không tìm thấy bản ghi phù hợp.
        </p>
      ) : (
        <ul className="space-y-2 pb-4">
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
                  <div className="bg-surface-container-highest p-4 rounded-m3-md">
                    <div className="flex items-center gap-4">
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                        style={{ background: m.color + "40" }}
                      >
                        {m?.emoji}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <p className="t-title-medium leading-tight">{m?.label}</p>
                        <span className="flex items-center gap-1 t-body-small text-on-surface-variant">
                          <Clock3 size={14} />
                          {relativeDateLabel(e.date)}
                          {time
                            ? `, ${time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      {e.note && (
                        <p className="t-body-medium text-on-surface-variant mt-3">{e.note}</p>
                      )}
                      {e.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {e.activities.map((id) => {
                            const a = activityById[id];
                            if (!a) return null;
                            return (
                              <span key={id} className="chip chip-static !bg-surface-container-low">
                                <span>{a.emoji}</span>
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

function CalendarView({ loading, entries, activityById, moodByKey }) {
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

  if (loading) return <CalendarSkeleton />;

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
          className="icon-btn state"
        >
          <ChevronLeft size={24} />
        </button>
        <p className="t-title-large">
          {MONTHS_VI[month]} {year}
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Tháng sau"
          className="icon-btn state"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <p className="t-body-small text-on-surface-variant text-center mb-4">
        Chạm vào ngày trống để tạo check-in mới
      </p>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center t-label-medium text-on-surface-variant py-1">
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
              className="state aspect-square rounded-full flex flex-col items-center justify-center text-base gap-0.5"
              style={{
                background: m ? m.color + "40" : "transparent",
                boxShadow:
                  selected === iso
                    ? "inset 0 0 0 2px rgb(var(--md-primary))"
                    : "none",
              }}
            >
              {m ? (
                <span>{m.emoji}</span>
              ) : (
                <span className="t-body-medium">{d}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedEntry && (
        <div className="mt-5 card-filled p-4 pop-in">
          <p className="t-title-medium mb-1">
            {moodByKey(selectedEntry.mood)?.emoji}{" "}
            {moodByKey(selectedEntry.mood)?.label} · {selected}
          </p>
          {selectedEntry.note && (
            <p className="t-body-medium text-on-surface-variant mb-2">{selectedEntry.note}</p>
          )}
          {selectedEntry.activities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedEntry.activities.map((id) => {
                const a = activityById[id];
                if (!a) return null;
                return (
                  <span key={id} className="chip chip-static !bg-surface-container-low">
                    <span>{a.emoji}</span>
                    {a.label}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-text-error state"
            >
              Xóa
            </button>
            <button
              onClick={() => navigate(`/checkin/${selectedEntry.id}`)}
              className="btn btn-tonal state"
            >
              Sửa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
