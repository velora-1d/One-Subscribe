import { Skeleton } from "./skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 font-sans text-left page-transition">
      {/* Title Panel Skeleton */}
      <div className="relative bg-white/80 border border-slate-200/80 rounded-2xl p-6 flex justify-between items-center shadow-lg shadow-slate-100/30">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-md shadow-slate-100/20">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section Skeleton */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-lg shadow-slate-100/30 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 w-full">
      <div className="overflow-x-auto w-full border border-slate-100 rounded-xl bg-white/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <Skeleton className="h-3.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-6 py-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PageTableSkeleton() {
  return (
    <div className="space-y-8 font-sans text-left page-transition">
      {/* Header Panel Skeleton */}
      <div className="relative bg-white/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Main Table Card Skeleton */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-lg shadow-slate-100/30 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2">
          <Skeleton className="h-10 w-full sm:max-w-xs rounded-xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  )
}
