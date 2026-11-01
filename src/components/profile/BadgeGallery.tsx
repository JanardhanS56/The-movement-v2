import * as React from "react"
import { Badge as BadgeType } from "@/lib/schemas/badge.schema"
import { formatDateOnly } from "@/lib/date"
import { Award, ShieldCheck, Compass, Star, Shield } from "lucide-react"

export interface BadgeGalleryProps {
  badges: BadgeType[]
}

function getBadgeIcon(type: BadgeType["badge_type"]) {
  switch (type) {
    case "early_adopter":
      return Compass
    case "organizer_verified":
      return ShieldCheck
    case "movement_founder":
      return Star
    case "task_complete":
    default:
      return Award
  }
}

export function BadgeGallery({ badges }: BadgeGalleryProps) {
  return (
    <section aria-labelledby="badges-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 id="badges-heading" className="text-lg font-bold tracking-tight text-foreground">
            Earned badges
          </h3>
        </div>
        <span className="text-xs tabular-nums font-medium px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground border border-border">
          {badges.length} {badges.length === 1 ? "badge" : "badges"}
        </span>
      </div>

      {badges.length === 0 ? (
        <div className="p-8 text-center rounded-md border border-dashed border-border bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground mx-auto mb-3">
            <Award className="h-6 w-6" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No badges awarded</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Badges are earned through verified task completions and confirmed community contributions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const Icon = getBadgeIcon(badge.badge_type)
            const methodLabel =
              badge.issued_by === "peer_vote" ? "Peer Vote" : "Organizer Verified"

            return (
              <div
                key={badge.id}
                tabIndex={0}
                role="article"
                aria-label={`Badge: ${badge.badge_label}. Awarded ${formatDateOnly(badge.awarded_at)}. ${methodLabel}.`}
                className="group relative flex flex-col items-center text-center p-4 rounded-md border border-border bg-card hover:bg-secondary/40 hover:border-primary/60 focus:bg-secondary/40 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-all cursor-default"
              >
                {/* Medallion circle */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-secondary/80 text-primary group-hover:border-primary group-hover:scale-105 group-focus-visible:border-primary group-focus-visible:scale-105 transition-all shadow-xs mb-3">
                  <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>

                {/* Badge Name: visible on hover AND keyboard focus */}
                <span className="font-semibold text-sm text-foreground group-hover:text-primary group-focus-visible:text-primary transition-colors line-clamp-2">
                  {badge.badge_label}
                </span>

                {/* Verification method and date */}
                <span className="mt-1 text-xs text-muted-foreground">
                  {methodLabel}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground/80">
                  {formatDateOnly(badge.awarded_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
