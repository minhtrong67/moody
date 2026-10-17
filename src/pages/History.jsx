import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { useSessionState, reviveDate } from "../hooks/useSessionState";
import { useNavigate } from "react-router-dom";
import {
  List, Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  ChevronDown, Clock3, Pencil, Trash2, RotateCcw,
} from "../components/icons";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
import { useI18n } from "../i18n";
import { daysInMonth, relativeDateLabel } from "../lib/dateUtils";
import SwipeableRow from "../components/SwipeableRow";
import ConfirmDialog from "../components/ConfirmDialog";
import BottomSheet from "../components/BottomSheet";
import SegmentedButton from "../components/SegmentedButton";
import TextField from "../components/TextField";
import { EntryListSkeleton, CalendarSkeleton } from "../components/PageSkeleton";

const PERIOD_KEYS = ["all", "week", "month"];
const SORT_KEYS = ["date_desc", "date_asc", "score_desc", "score_asc"];

export default function History() {
  const { entries, loading: entriesLoading, deleteEntry } = useMoodEntries();
  const { activities, loading: activitiesLoading } = useActivities();
  const { moodByKey, moods, loading: moodsLoading } = useMoods();
  const { t } = useI18n();
  const loading = entriesLoading || activitiesLoading || moodsLoading;
  const [view, setView] = useSessionState("history.view", "list");

  const activityById = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities]);

  return (
    <div className="page page-enter">
      <h1 className="t-headline-medium mb-4 pt-2">{t("history.title")}</h1>

      <SegmentedButton
        className="mb-5 md:max-w-sm"
        value={view}
        onChange={setView}
        options={[
          { key: "list", label: t("history.list"), icon: List },
          { key: "calendar", label: t("history.calendar"), icon: CalendarIcon },
        ]}
      />

      {view === "list" ? (
        <ListView loading={loading} entries={entries} deleteEntry={deleteEntry} activityById={activityById} moodByKey={moodByKey} moods={moods} />
      ) : (
        <CalendarView loading={loading} entries={entries} activityById={activityById} moodByKey={moodByKey} moods={moods} />
      )}
    </div>
  );
}

function ListView({ loading, entries, deleteEntry, activityById, moodByKey, moods }) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [period, setPeriod] = useSessionState("history.period", "all");
  const [moodFilter, setMoodFilter] = useSessionState("history.mood", "all");
  const [sort, setSort] = useSessionState("history.sort", "date_desc");
  const [search, setSearch] = useSessionState("history.search", "");
  const deferredSearch = useDeferredValue(search); // gõ tìm kiếm không làm khựng ô nhập
  const [filtersOpen, setFiltersOpen] = useSessionState("history.filtersOpen", false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const resetFilters = () => {
    setPeriod("all");
    setMoodFilter("all");
    setSort("date_desc");
  };

  const activeFilterCount = (period !== "all" ? 1 : 0) + (moodFilter !== "all" ? 1 : 0) + (sort !== "date_desc" ? 1 : 0);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = deferredSearch.trim().toLowerCase();

    const list = entries.filter((e) => {
      if (moodFilter !== "all" && e.mood !== moodFilter) return false;
      if (period !== "all") {
        const d = new Date(e.date);
        if (period === "week") {
          const diffDays = (now - d) / 86400000;
          if (!(diffDays >= 0 && diffDays < 7)) return false;
        }
        if (period === "month" && !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())) return false;
      }
      if (q) {
        const activityLabels = (e.activities || []).map((id) => activityById[id]?.label || "").join(" ");
        if (!`${e.note || ""} ${activityLabels}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "date_desc") return a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1;
      if (sort === "date_asc") return a.date === b.date ? (a.time > b.time ? 1 : -1) : a.date > b.date ? 1 : -1;
      if (sort === "score_desc") return b.score - a.score;
      return a.score - b.score;
    });
  }, [entries, moodFilter, period, deferredSearch, sort, activityById]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete.id);
    setPendingDelete(null);
  };
  const handleEdit = useCallback((id) => navigate(`/checkin/${id}`), [navigate]);

  return (
    <>
      <ConfirmDialog
        open={!!pendingDelete}
        title={t("history.deleteTitle")}
        description={t("common.irreversible")}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Bố cục dạng cột: thanh tìm kiếm + bộ lọc nằm trên, danh sách thẻ nằm dưới (lưới đều nhau trên màn hình lớn). */}
      <div className="flex flex-col gap-4">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-4 lg:items-start space-y-3 lg:space-y-0">
          <div className="relative">
            <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("history.searchPlaceholder")}
              aria-label={t("history.search")}
              className="w-full h-14 rounded-full bg-surface-container-high pl-14 pr-4 t-body-large focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="card-filled overflow-hidden">
            <button onClick={() => setFiltersOpen((v) => !v)} className="state w-full flex items-center gap-4 px-4 h-14" aria-expanded={filtersOpen}>
              <SlidersHorizontal size={24} className="text-on-surface-variant shrink-0" />
              <span className="flex-1 text-left t-title-small">{t("history.filters")}</span>
              {activeFilterCount > 0 && (
                <span className="min-w-6 h-6 px-1.5 rounded-full bg-primary text-on-primary t-label-small flex items-center justify-center shrink-0">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={24} className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && (
<<<<<<< HEAD
              <div className="px-4 pb-4 pt-3 pop-in">
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
                  <TextField as="select" label={t("history.period")} fieldBg="var(--md-surface-container-highest)" value={period} onChange={(e) => setPeriod(e.target.value)}>
                    {PERIOD_KEYS.map((k) => (<option key={k} value={k}>{t(`history.period.${k}`)}</option>))}
                  </TextField>
                  <TextField as="select" label={t("history.mood")} fieldBg="var(--md-surface-container-highest)" value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
                    <option value="all">{t("history.allMoods")}</option>
                    {moods.map((m) => (<option key={m.key} value={m.key}>{m.emoji} {m.label}</option>))}
                  </TextField>
                  <TextField as="select" label={t("history.sort")} fieldBg="var(--md-surface-container-highest)" value={sort} onChange={(e) => setSort(e.target.value)}>
                    {SORT_KEYS.map((k) => (<option key={k} value={k}>{t(`history.sort.${k}`)}</option>))}
                  </TextField>
                </div>
                <button type="button" onClick={resetFilters} disabled={activeFilterCount === 0} className="btn btn-tonal btn-block state justify-center mt-4">
=======
              <div className="px-4 pb-4 pt-3 pop-in space-y-4">
                <TextField as="select" label={t("history.period")} fieldBg="var(--md-surface-container-highest)" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {PERIOD_KEYS.map((k) => (<option key={k} value={k}>{t(`history.period.${k}`)}</option>))}
                </TextField>
                <TextField as="select" label={t("history.mood")} fieldBg="var(--md-surface-container-highest)" value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
                  <option value="all">{t("history.allMoods")}</option>
                  {moods.map((m) => (<option key={m.key} value={m.key}>{m.emoji} {m.label}</option>))}
                </TextField>
                <TextField as="select" label={t("history.sort")} fieldBg="var(--md-surface-container-highest)" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORT_KEYS.map((k) => (<option key={k} value={k}>{t(`history.sort.${k}`)}</option>))}
                </TextField>
                <button type="button" onClick={resetFilters} disabled={activeFilterCount === 0} className="btn btn-tonal btn-block state justify-center">
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
                  <RotateCcw size={18} />
                  {t("history.resetFilters")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="t-body-small text-on-surface-variant mb-3 px-1">
            {loading ? t("common.loading") : t("history.count", { n: filtered.length })}
            {!loading && <span className="md:hidden"> · {t("history.swipeHint")}</span>}
          </p>

          {loading ? (
            <EntryListSkeleton />
          ) : filtered.length === 0 ? (
            <p className="t-body-medium text-on-surface-variant text-center py-16">{t("history.empty")}</p>
          ) : (
            <ul className="space-y-2 pb-4 md:space-y-0 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:auto-rows-fr">
              {filtered.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  mood={moodByKey(e.mood)}
                  activityById={activityById}
                  onEdit={handleEdit}
                  onDelete={setPendingDelete}
                  t={t}
                  locale={locale}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// memo: gõ tìm kiếm / mở bộ lọc không phải render lại hàng trăm thẻ không đổi.
// content-visibility: trình duyệt bỏ qua layout/paint của thẻ nằm ngoài màn hình.
const EntryCard = memo(function EntryCard({ entry: e, mood: m, activityById, onEdit, onDelete, t, locale }) {
  const time = e.time ? new Date(e.time) : null;
  return (
    <li className="cv-auto h-full">
      <SwipeableRow onEdit={() => onEdit(e.id)} onDelete={() => onDelete(e)}>
        <div className="bg-surface-container-highest p-4 rounded-m3-md h-full">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: m.color + "40" }}>
              {m?.emoji}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="t-title-medium leading-tight">{m?.label}</p>
              <span className="flex items-center gap-1 t-body-small text-on-surface-variant">
                <Clock3 size={14} />
                {relativeDateLabel(e.date, t, locale)}
                {time ? `, ${time.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
            </div>
            {/* Chuột / bàn phím: nút sửa & xóa (vuốt chỉ dành cho cảm ứng) */}
            <div className="hidden md:flex shrink-0 -mr-1">
              <button onClick={() => onEdit(e.id)} aria-label={t("common.edit")} title={t("common.edit")} className="icon-btn icon-btn-primary state"><Pencil size={20} /></button>
              <button onClick={() => onDelete(e)} aria-label={t("common.delete")} title={t("common.delete")} className="icon-btn state"><Trash2 size={20} /></button>
            </div>
          </div>

          {e.note && <p className="t-body-medium text-on-surface-variant mt-3">{e.note}</p>}
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
      </SwipeableRow>
    </li>
  );
});

function CalendarView({ loading, entries, activityById, moodByKey, moods }) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [cursor, setCursor] = useSessionState("history.cursor", () => new Date(), { revive: reviveDate });
  const [selected, setSelected] = useState(null);

  // Mọi check-in của từng ngày (mới nhất trước); ô lịch hiển thị check-in mới nhất.
  const byDate = useMemo(() => {
    const map = {};
    for (const e of entries) (map[e.date] ||= []).push(e);
    for (const list of Object.values(map)) list.sort((a, b) => (a.time < b.time ? 1 : -1));
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const total = daysInMonth(year, month);
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const weekdays = t("weekdays.short");

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const handleDayClick = (iso) => (byDate[iso] ? setSelected(iso) : navigate(`/checkin?date=${iso}`));
  const closeSheet = useCallback(() => setSelected(null), []);
  const selectedList = selected ? byDate[selected] || [] : [];
  const monthLabel = cursor.toLocaleDateString(locale, { month: "long", year: "numeric" });
<<<<<<< HEAD
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = useMemo(
    () => Object.entries(byDate).filter(([d]) => d.startsWith(monthPrefix)).map(([, list]) => list[0]),
    [byDate, monthPrefix],
  );
=======
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  if (loading) return <CalendarSkeleton />;

  return (
<<<<<<< HEAD
    <div className="pb-4 pop-in lg:grid lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-10 lg:items-start">
=======
    <div className="pb-4 pop-in max-w-xl">
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
      <BottomSheet open={!!selected} title={selectedLabel} onClose={closeSheet}>
        <p className="t-body-small text-on-surface-variant -mt-2 mb-4">{t("history.count", { n: selectedList.length })}</p>
        <ul className="space-y-3">
          {selectedList.map((e) => (
            <EntryDetail key={e.id} entry={e} mood={moodByKey(e.mood)} activityById={activityById} t={t} locale={locale} />
          ))}
        </ul>
      </BottomSheet>

<<<<<<< HEAD
      <div>
=======
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label={t("history.prevMonth")} className="icon-btn state">
          <ChevronLeft size={24} />
        </button>
        <p className="t-title-large capitalize">{monthLabel}</p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label={t("history.nextMonth")} className="icon-btn state">
          <ChevronRight size={24} />
        </button>
      </div>

      <p className="t-body-small text-on-surface-variant text-center mb-4">{t("history.calendarHint")}</p>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((w) => (
          <div key={w} className="text-center t-label-medium text-on-surface-variant py-1">{w}</div>
        ))}
<<<<<<< HEAD
=======
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoFor(d);
          const entry = byDate[iso]?.[0];
          const m = entry ? moodByKey(entry.mood) : null;
          return (
            <button
              key={i}
              onClick={() => handleDayClick(iso)}
              className="state aspect-square rounded-full flex flex-col items-center justify-center text-base gap-0.5"
              style={{ background: m ? m.color + "40" : "transparent" }}
            >
              {m ? <span>{m.emoji}</span> : <span className="t-body-medium">{d}</span>}
            </button>
          );
        })}
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoFor(d);
          const entry = byDate[iso]?.[0];
          const m = entry ? moodByKey(entry.mood) : null;
          return (
            <button
              key={i}
              onClick={() => handleDayClick(iso)}
              className="state aspect-square rounded-full flex flex-col items-center justify-center text-base gap-0.5"
              style={{ background: m ? m.color + "40" : "transparent" }}
            >
              {m ? <span>{m.emoji}</span> : <span className="t-body-medium">{d}</span>}
            </button>
          );
        })}
      </div>
      </div>

      <MonthSummary entries={monthEntries} moods={moods} t={t} />
    </div>
  );
}

// Chi tiết một check-in (chỉ xem, không có sửa / xóa).
function EntryDetail({ entry: e, mood: m, activityById, t, locale }) {
  const time = e.time ? new Date(e.time) : null;
  return (
    <li className="card-filled p-4">
      <div className="flex items-center gap-4">
        <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: (m?.color || "#999") + "40" }}>
          {m?.emoji}
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <p className="t-title-medium leading-tight">{m?.label}</p>
          <span className="flex items-center gap-1 t-body-small text-on-surface-variant">
            <Clock3 size={14} />
            {time ? time.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        </div>
        <span className="t-label-large text-on-surface-variant shrink-0">{t("history.score", { n: e.score ?? m?.score ?? "—" })}</span>
      </div>
      <p className="t-label-medium text-primary mt-4 mb-1">{t("history.note")}</p>
      <p className="t-body-medium text-on-surface-variant whitespace-pre-wrap break-words">{e.note || t("history.noNote")}</p>
      <p className="t-label-medium text-primary mt-4 mb-2">{t("history.activities")}</p>
      {e.activities?.some((id) => activityById[id]) ? (
        <div className="flex flex-wrap gap-1.5">
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
      ) : (
        <p className="t-body-medium text-on-surface-variant">{t("history.noActivities")}</p>
      )}
    </li>
  );
}
<<<<<<< HEAD

// Tóm tắt tháng đang xem (hiện ở cột phải trên màn hình lớn, dưới lịch trên màn hình nhỏ).
function MonthSummary({ entries, moods, t }) {
  const avg = entries.length ? entries.reduce((a, e) => a + (e.score || 0), 0) / entries.length : null;
  const counts = Object.fromEntries(moods.map((m) => [m.key, 0]));
  for (const e of entries) counts[e.mood] = (counts[e.mood] || 0) + 1;
  const max = Math.max(1, ...Object.values(counts));
  return (
    <aside className="mt-6 lg:mt-0 card-filled p-5 lg:sticky lg:top-20">
      <p className="t-title-medium mb-4">{t("history.monthSummary")}</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-m3-md bg-surface-container-highest px-4 py-3">
          <p className="t-headline-small leading-none">{entries.length}</p>
          <p className="t-label-medium text-on-surface-variant mt-1.5">{t("history.monthDays")}</p>
        </div>
        <div className="rounded-m3-md bg-surface-container-highest px-4 py-3">
          <p className="t-headline-small leading-none">{avg != null ? `${avg.toFixed(1)}/5` : "—"}</p>
          <p className="t-label-medium text-on-surface-variant mt-1.5">{t("history.monthAvg")}</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {moods.map((m) => (
          <li key={m.key} className="flex items-center gap-3">
            <span className="w-8 text-center text-xl shrink-0">{m.emoji}</span>
            <span className="t-body-medium w-24 truncate shrink-0">{m.label}</span>
            <span className="flex-1 h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(counts[m.key] / max) * 100}%`, background: m.color }} />
            </span>
            <span className="t-label-large text-on-surface-variant w-6 text-right shrink-0">{counts[m.key]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
=======
>>>>>>> 48fe23bae97abbe87a88efacb09fa315539c6546
