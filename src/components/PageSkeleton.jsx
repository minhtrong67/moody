// Bộ skeleton dùng chung: mỗi khối mô phỏng đúng hình dạng nội dung thật để
// tránh "nhảy layout" khi dữ liệu về.

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

// Danh sách card check-in (Lịch sử)
export function EntryListSkeleton({ count = 5 }) {
  return (
    <ul className="space-y-2.5 pb-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="card-filled p-4 flex gap-3">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// Lịch tháng
export function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-m3-md" />
        ))}
      </div>
    </div>
  )
}

// Thẻ trạng thái hôm nay (hero Dashboard)
export function TodayCardSkeleton() {
  return (
    <div className="relative card-filled p-4 flex items-center gap-4" aria-busy="true">
      <Skeleton className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
    </div>
  )
}

// Phần thân Dashboard: 3 chỉ số + dải tuần + check-in gần đây
export function DashboardBodySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-3 gap-3 mb-9">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-m3-md" />
        ))}
      </div>
      <Skeleton className="h-4 w-20 rounded mb-3" />
      <div className="flex justify-between mb-9">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-2.5 w-5 rounded" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-32 rounded mb-3" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[58px] rounded-m3-md" />
        ))}
      </div>
    </div>
  )
}

// Trang Thống kê: các hàng chỉ số + khối biểu đồ
export function StatsBodySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="space-y-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[58px] rounded-m3-md" />
        ))}
      </div>
      <Skeleton className="h-4 w-40 rounded mb-2" />
      <Skeleton className="w-full aspect-[4/3] max-h-64 rounded-m3-md mb-8" />
      <Skeleton className="h-4 w-32 rounded mb-2" />
      <Skeleton className="w-full aspect-[4/3] max-h-64 rounded-m3-md mb-3" />
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-4 w-28 rounded mb-2" />
      <Skeleton className="w-full aspect-square max-h-72 rounded-m3-md" />
    </div>
  )
}

// Lưới hoạt động (Check-in)
export function ActivityGridSkeleton() {
  return (
    <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading">
      {[88, 96, 80, 104, 92, 84, 100, 90, 98, 86].map((w, i) => (
        <Skeleton key={i} className="h-8 rounded-m3-sm" style={{ width: w }} />
      ))}
    </div>
  )
}

// Dãy 5 mức tâm trạng (Check-in)
export function MoodPickerSkeleton() {
  return (
    <div className="flex justify-between mb-8" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="h-2.5 w-10 rounded" />
        </div>
      ))}
    </div>
  )
}

// Danh sách hàng (Quản lý hoạt động / tâm trạng)
export function ManageListSkeleton({ count = 6 }) {
  return (
    <ul className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 card-filled p-3">
          <Skeleton className="w-4 h-6 rounded shrink-0" />
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        </li>
      ))}
    </ul>
  )
}

// ---- Skeleton toàn trang (fallback của lazy route) ----
const VARIANTS = {
  dashboard: () => (
    <div className="page">
      <div className="bg-primary-container/40 px-4 pt-6 pb-7 mb-6 rounded-b-m3-xl">
        <Skeleton className="h-3 w-28 rounded mb-2" />
        <Skeleton className="h-7 w-52 rounded mb-1.5" />
        <Skeleton className="h-7 w-40 rounded mb-5" />
        <TodayCardSkeleton />
      </div>
      <div className="px-4"><DashboardBodySkeleton /></div>
    </div>
  ),
  history: () => (
    <div className="page pt-2">
      <Skeleton className="h-7 w-44 rounded mb-4" />
      <Skeleton className="h-10 w-full rounded-full mb-5" />
      <Skeleton className="h-14 w-full rounded-full mb-3" />
      <Skeleton className="h-14 w-full rounded-m3-md mb-4" />
      <EntryListSkeleton />
    </div>
  ),
  stats: () => (
    <div className="page pt-2 pb-8">
      <Skeleton className="h-7 w-28 rounded mb-5" />
      <Skeleton className="h-10 w-full rounded-full mb-4" />
      <Skeleton className="h-10 w-full rounded-full mb-5" />
      <Skeleton className="h-10 w-full rounded-full mb-8" />
      <StatsBodySkeleton />
    </div>
  ),
  manage: () => (
    <div className="page pt-2 pb-8">
      <Skeleton className="h-7 w-48 rounded mb-2" />
      <Skeleton className="h-3.5 w-64 rounded mb-6" />
      <Skeleton className="h-12 w-full rounded-m3-md mb-6" />
      <ManageListSkeleton />
    </div>
  ),
  form: () => (
    <div className="px-4 pt-6 pb-28 max-w-lg md:max-w-2xl mx-auto">
      <Skeleton className="h-8 w-24 rounded-full mb-5" />
      <Skeleton className="h-7 w-32 rounded mb-2" />
      <Skeleton className="h-3.5 w-48 rounded mb-5" />
      <Skeleton className="h-14 w-full rounded-m3-md mb-6" />
      <MoodPickerSkeleton />
      <Skeleton className="h-4 w-40 rounded mb-4" />
      <ActivityGridSkeleton />
      <Skeleton className="h-4 w-28 rounded mt-7 mb-3" />
      <Skeleton className="h-20 w-full rounded-m3-md mb-8" />
      <Skeleton className="h-12 w-full rounded-m3-md" />
    </div>
  ),
  settings: () => (
    <div className="page pt-2 pb-4">
      <Skeleton className="h-7 w-28 rounded mb-6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-8">
          <Skeleton className="h-4 w-24 rounded mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="h-11 flex-1 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PageSkeleton({ variant = 'history' }) {
  const Variant = VARIANTS[variant] || VARIANTS.history
  return <Variant />
}
