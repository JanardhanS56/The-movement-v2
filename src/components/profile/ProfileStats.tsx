import * as React from "react"
import { UserStats } from "@/lib/api/types"
import { CheckSquare, Megaphone, MapPin, Zap } from "lucide-react"

export interface ProfileStatsProps {
  stats: UserStats
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const hasValidatedPoints = stats.impactPoints > 0

  return (
    <section aria-label="Volunteer Activity Summary">
      <div
        className={`grid gap-4 ${
          hasValidatedPoints
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {/* Tasks Completed */}
        <div className="p-4 rounded-md border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Tasks Completed
            </span>
            <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {stats.tasksCompleted}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Peer or organizer verified
          </p>
        </div>

        {/* Announcements Signed */}
        <div className="p-4 rounded-md border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Announcements Signed
            </span>
            <Megaphone className="h-4 w-4 text-caution" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {stats.announcementsSigned}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Cryptographic consensus
          </p>
        </div>

        {/* Check-ins */}
        <div className="p-4 rounded-md border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Field Check-ins
            </span>
            <MapPin className="h-4 w-4 text-verified" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {stats.checkInsCount}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Approximate privacy grid
          </p>
        </div>

        {/* Impact Points: Only shown if validated data exists */}
        {hasValidatedPoints && (
          <div className="p-4 rounded-md border border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between text-primary-light mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Impact Points
              </span>
              <Zap className="h-4 w-4 text-primary fill-primary/20" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold font-mono text-primary-light">
              +{stats.impactPoints}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Validated ledger points
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
