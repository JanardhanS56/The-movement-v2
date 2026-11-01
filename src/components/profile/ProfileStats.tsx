import * as React from "react"
import { UserStats } from "@/lib/api/types"
import { CheckSquare, Megaphone, MapPin, Zap } from "lucide-react"

export interface ProfileStatsProps {
  stats: UserStats
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const hasValidatedPoints = stats.impactPoints > 0

  return (
    <section aria-label="Volunteer activity summary">
      <div
        className={`grid gap-4 ${
          hasValidatedPoints
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {/* Tasks completed */}
        <div className="p-5 rounded-sm border-2 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between text-ink/70 mb-2">
            <span className="text-sm font-semibold text-ink">
              Tasks completed
            </span>
            <CheckSquare className="h-4 w-4 text-cobalt" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black tabular-nums text-ink">
            {stats.tasksCompleted}
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Peer or organizer verified
          </p>
        </div>

        {/* Announcements signed */}
        <div className="p-5 rounded-sm border-2 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between text-ink/70 mb-2">
            <span className="text-sm font-semibold text-ink">
              Announcements signed
            </span>
            <Megaphone className="h-4 w-4 text-sun" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black tabular-nums text-ink">
            {stats.announcementsSigned}
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Co-signed by organizers
          </p>
        </div>

        {/* Check-ins */}
        <div className="p-5 rounded-sm border-2 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between text-ink/70 mb-2">
            <span className="text-sm font-semibold text-ink">
              Field check-ins
            </span>
            <MapPin className="h-4 w-4 text-cobalt" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black tabular-nums text-ink">
            {stats.checkInsCount}
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Rounded to ~100m
          </p>
        </div>

        {/* Impact points */}
        {hasValidatedPoints && (
          <div className="p-5 rounded-sm border-2 border-ink bg-lime shadow-hard-sm">
            <div className="flex items-center justify-between text-ink mb-2">
              <span className="text-sm font-bold text-ink">
                Impact points
              </span>
              <Zap className="h-4 w-4 text-ink fill-ink/20" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black tabular-nums text-ink">
              +{stats.impactPoints}
            </div>
            <p className="mt-1 text-xs text-ink/70">
              Verified ledger score
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
