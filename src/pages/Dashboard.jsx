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
} from "../components/icons";
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
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="t-body-large text-on-surface-variant mb-1">
              {greeting}
              {user?.displayName
                ? `, ${user.displayName.split(" ").pop()}`
                : ""}
            </p>
            <h1 className="t-headline-medium">
              Hôm nay bạn
              <br />
              cảm thấy thế nào?
            </h1>
          </div>
          {user?.photoURL && (
            <button
              onClick={logout}
              title="Đăng xuất"
              className="state shrink-0 ml-3 rounded-full"
            >
              <img
                src={user.photoURL}
                alt="Đăng xuất"
                className="w-10 h-10 rounded-full"
              />
            </button>
          )}
        </div>

        {loading ? (
          <TodayCardSkeleton />
        ) : todayEntry ? (
          <div className="relative bg-primary-container text-on-primary-container rounded-m3-xl p-5 flex items-center gap-4">
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 bg-surface/60"
            >
              {moodByKey(todayEntry.mood)?.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="t-title-medium">
                Đã check-in: {moodByKey(todayEntry.mood)?.label}
              </p>
              {todayEntry.note && (
                <p className="t-body-medium opacity-80 mt-0.5 line-clamp-2">
                  {todayEntry.note}
                </p>
              )}
            </div>
            <Link
              to={`/checkin/${todayEntry.id}`}
              className="icon-btn state bg-surface/60 text-on-primary-container"
              aria-label="Sửa check-in"
            >
              <Pencil size={20} />
            </Link>
          </div>
        ) : (
          <div className="bg-primary-container text-on-primary-container rounded-m3-xl p-5">
            <div className="flex items-center gap-4 mb-5">
              <span className="w-12 h-12 rounded-full bg-surface/60 flex items-center justify-center shrink-0">
                <NotebookPen size={24} />
              </span>
              <div>
                <p className="t-title-medium">Bạn chưa check-in hôm nay</p>
                <p className="t-body-medium opacity-80">Chỉ mất vài giây</p>
              </div>
            </div>
            <Link to="/checkin" className="btn btn-filled state">
              Check-in ngay
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <div className="px-4">
        {loading ? (
          <DashboardBodySkeleton />
        ) : (
          <>
        <div className="grid grid-cols-3 gap-3 mb-8">
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

        <div className="mb-8">
          <p className="t-title-medium mb-3">Tuần này</p>
          <div className="card-filled px-3 py-4 flex justify-between">
            {week.map((d, i) => {
              const entry = byDate[d];
              const m = entry ? moodByKey(entry.mood) : null;
              const isToday = d === today;
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base"
                    style={{
                      background: m
                        ? m.color + "40"
                        : "rgb(var(--md-surface-container-low))",
                      boxShadow: isToday
                        ? "0 0 0 2px rgb(var(--md-primary))"
                        : "none",
                    }}
                  >
                    {m ? m.emoji : ""}
                  </div>
                  <span
                    className={`t-label-medium ${isToday ? "text-primary" : "text-on-surface-variant"}`}
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
            <div className="flex items-center justify-between mb-2">
              <p className="t-title-medium">Check-in gần đây</p>
              <Link to="/history" className="btn btn-text state -mr-3">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((e) => {
                const m = moodByKey(e.mood);
                return (
                  <Link
                    key={e.id}
                    to={`/checkin/${e.id}`}
                    className="state flex items-center gap-4 card-filled px-4 py-3"
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{ background: m.color + "40" }}
                    >
                      {m.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="t-body-large truncate">
                        {m.label}
                      </p>
                      <p className="t-body-medium text-on-surface-variant truncate">
                        {relativeDateLabel(e.date)}
                        {(e.note || e.activities?.length > 0) && " · "}
                        {e.note ||
                          (e.activities || [])
                            .map((id) => activityById[id]?.emoji)
                            .filter(Boolean)
                            .join(" ")}
                      </p>
                    </div>
                    <ChevronRight
                      size={24}
                      className="text-on-surface-variant shrink-0"
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
    <div className="card-filled px-2 py-4 flex flex-col items-center text-center gap-2">
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: color + "33", color }}
      >
        <Icon size={24} />
      </span>
      <div>
        <p className="t-title-large leading-none">{value}</p>
        <p className="t-label-small text-on-surface-variant mt-1.5">{label}</p>
      </div>
    </div>
  );
}
