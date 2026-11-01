import * as React from "react"

export function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading volunteer profile details"
      className="space-y-8 animate-pulse"
    >
      {/* Header Profile Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-md border border-border bg-card">
        {/* Avatar skeleton */}
        <div className="h-20 w-20 rounded-full bg-secondary shrink-0 border border-border" />
        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="h-7 w-48 bg-secondary rounded-sm" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-secondary rounded-sm" />
            <div className="h-5 w-36 bg-secondary rounded-sm" />
          </div>
          <div className="h-4 w-40 bg-secondary/70 rounded-sm" />
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-md border border-border bg-card space-y-2"
          >
            <div className="h-4 w-24 bg-secondary rounded-sm" />
            <div className="h-7 w-16 bg-secondary rounded-sm" />
          </div>
        ))}
      </div>

      {/* Badge Gallery Skeleton (Avatar plus 4 badge circles) */}
      <div className="p-6 rounded-md border border-border bg-card space-y-4">
        <div className="h-6 w-32 bg-secondary rounded-sm" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center p-4 rounded-md border border-border/50 bg-secondary/20 space-y-3"
            >
              <div className="h-14 w-14 rounded-full bg-secondary border border-border" />
              <div className="h-4 w-20 bg-secondary rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Impact Ledger Skeleton */}
      <div className="p-6 rounded-md border border-border bg-card space-y-4">
        <div className="h-6 w-40 bg-secondary rounded-sm" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-sm border border-border/40 bg-secondary/10 flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-48 bg-secondary rounded-sm" />
                <div className="h-3 w-32 bg-secondary/70 rounded-sm" />
              </div>
              <div className="h-5 w-16 bg-secondary rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
