import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Pencil,
  ArrowRight,
  NotebookPen,
  Flame,
  TrendingUp,
  CalendarCheck2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
import { TodayCardSkeleton, DashboardBodySkeleton } from "../components/PageSkeleton";
import {
  calcStreak,
  daysOfWeek,
  todayISO,
  relativeDateLabel,
} from "../lib/dateUtils";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { entries, loading } = useMoodEntries();
  const { activities } = useActivities();
  const { moodByKey } = useMoods();

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const activityById = useMemo(
    () => Object.fromEntries(activities.map((a) => [a.id, a])),
    [activities],
  );

  const byDate = useMemo(() => {
    const map = {};
    for (const e of entries)
      if (!map[e.date] || e.time > map[e.date].time) map[e.date] = e;
    return map;
  }, [entries]);

  const week = daysOfWeek(); // Thứ 2 -> Chủ nhật
  const weekAvg = useMemo(() => {
    const scores = week.map((d) => byDate[d]?.score).filter(Boolean);
    if (!scores.length) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [week, byDate]);

  const streak = calcStreak(byDate);
  const totalCheckins = Object.keys(byDate).length;
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Chào buổi sáng"
      : hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";

  const recent = useMemo(
    () =>
      Object.values(byDate)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 3),
    [byDate],
  );

  return (
    <div className="max-w-lg mx-auto page-enter">
      <div className="relative overflow-hidden bg-accent/10 px-4 pt-6 pb-7 mb-6 rounded-b-[1.5rem]">
        <div
          className="absolute -top-10 -right-16 w-48 h-48 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: "rgb(var(--c-accent))" }}
        />
        <div
          className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ background: "#F0A34E" }}
        />

        <div className="relative flex items-start justify-between mb-5">
          <div>
            <p className="text-inkmuted text-sm mb-1">
              {greeting}
              {user?.displayName
                ? `, ${user.displayName.split(" ").pop()}`
                : ""}
            </p>
            <h1 className="font-display text-2xl leading-snug">
              Hôm nay bạn
              <br />
              cảm thấy thế nào?
            </h1>
          </div>
          {user?.photoURL && (
            <button
              onClick={logout}
              title="Đăng xuất"
              className="shrink-0 ml-3 p-0.5 rounded-full bg-surface/70 backdrop-blur"
            >
              <img
                src={user.photoURL}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            </button>
          )}
        </div>

        {loading ? (
          <TodayCardSkeleton />
        ) : todayEntry ? (
          <div className="relative border border-line rounded-card p-4 flex items-center gap-4 bg-surface">
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ background: moodByKey(todayEntry.mood)?.color + "26" }}
            >
              {moodByKey(todayEntry.mood)?.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                Đã check-in: {moodByKey(todayEntry.mood)?.label}
              </p>
              {todayEntry.note && (
                <p className="text-sm text-inkmuted mt-0.5 line-clamp-2">
                  {todayEntry.note}
                </p>
              )}
            </div>
            <Link
              to={`/checkin/${todayEntry.id}`}
              className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0"
              aria-label="Sửa check-in"
            >
              <Pencil size={16} strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <Link
            to="/checkin"
            className="relative flex items-center gap-4 bg-primary text-oncolor rounded-card px-5 py-4 active:scale-[0.98] transition-transform shadow-md"
          >
            <span className="w-11 h-11 rounded-full bg-oncolor/25 flex items-center justify-center shrink-0">
              <NotebookPen size={20} />
            </span>
            <span className="flex-1">
              <span className="block font-medium">Check-in ngay</span>
              <span className="block text-xs text-oncolor/70">
                Chỉ mất vài giây
              </span>
            </span>
            <ArrowRight size={20} />
          </Link>
        )}
      </div>

      <div className="px-4">
        {loading ? (
          <DashboardBodySkeleton />
        ) : (
          <>
        <div className="grid grid-cols-3 gap-3 mb-9">
          <Stat
            icon={Flame}
            label="Chuỗi ngày"
            value={streak}
            color="#F0A34E"
          />
          <Stat
            icon={TrendingUp}
            label="TB tuần"
            value={weekAvg ? `${weekAvg}/5` : "—"}
            color="#7D8CB0"
          />
          <Stat
            icon={CalendarCheck2}
            label="Tổng check-in"
            value={totalCheckins}
            color="#8FBF7F"
          />
        </div>

        <div className="mb-9">
          <p className="text-sm font-medium mb-3">Tuần này</p>
          <div className="flex justify-between">
            {week.map((d, i) => {
              const entry = byDate[d];
              const m = entry ? moodByKey(entry.mood) : null;
              const isToday = d === today;
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base border-2"
                    style={{
                      background: m
                        ? m.color + "30"
                        : "rgb(var(--c-line) / 0.35)",
                      borderColor: isToday
                        ? "rgb(var(--c-accent))"
                        : "transparent",
                    }}
                  >
                    {m ? m.emoji : ""}
                  </div>
                  <span
                    className={`text-[11px] ${isToday ? "text-ink font-medium" : "text-inkmuted"}`}
                  >
                    {WEEKDAY_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {recent.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Check-in gần đây</p>
              <Link
                to="/history"
                className="flex items-center text-xs text-accent"
              >
                Xem tất cả <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((e) => {
                const m = moodByKey(e.mood);
                return (
                  <Link
                    key={e.id}
                    to={`/checkin/${e.id}`}
                    className="flex items-center gap-3 border border-line rounded-card px-3.5 py-3 bg-surface"
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: m.color + "26" }}
                    >
                      {m.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.label} · {relativeDateLabel(e.date)}
                      </p>
                      {(e.note || e.activities?.length > 0) && (
                        <p className="text-xs text-inkmuted truncate mt-0.5">
                          {e.note ||
                            e.activities
                              .map((id) => activityById[id]?.emoji)
                              .filter(Boolean)
                              .join(" ")}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-inkmuted shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div
      className="rounded-card px-2 py-3.5 flex flex-col items-center text-center gap-2 border"
      style={{ background: color + "14", borderColor: color + "40" }}
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: color + "30", color }}
      >
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <div>
        <p className="font-display text-base leading-none">{value}</p>
        <p className="text-inkmuted text-[10px] mt-1">{label}</p>
      </div>
    </div>
  );
}
