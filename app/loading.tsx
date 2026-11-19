export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-10 w-48 rounded-xl bg-slate-200" />
      <div className="mt-2 h-4 w-72 rounded-lg bg-slate-100" />

      {/* Metric Cards Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-7 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            <div className="h-4 w-4/6 rounded bg-slate-100" />
          </div>
          <div className="h-48 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-3">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-80 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-12 w-full rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
