export default function PageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <div className="skeleton h-7 w-40 rounded-lg mb-5" />
      <div className="skeleton h-24 w-full rounded-card mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="skeleton h-20 rounded-card" />
        <div className="skeleton h-20 rounded-card" />
        <div className="skeleton h-20 rounded-card" />
      </div>
      <div className="skeleton h-16 w-full rounded-card mb-3" />
      <div className="skeleton h-16 w-full rounded-card mb-3" />
      <div className="skeleton h-16 w-full rounded-card" />
    </div>
  )
}
