import * as React from "react"
import { User } from "@/lib/schemas/user.schema"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { formatDateOnly } from "@/lib/date"
import { Users, Calendar } from "lucide-react"

export interface ProfileHeaderProps {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const roleLabel =
    user.tier === 3
      ? "Movement Organizer"
      : user.tier === 2
      ? "Senior Field Steward"
      : "Active Volunteer"

  return (
    <section
      aria-label="Volunteer Member Identity"
      className="p-6 rounded-md border border-border bg-card shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <UserAvatar
          name={user.display_name}
          avatarUrl={user.avatar_url}
          className="h-20 w-20 text-xl font-bold border-2 border-border"
          fallbackClassName="text-lg"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {user.display_name}
            </h2>
            <TierBadge tier={user.tier} showIcon />
          </div>

          {/* Movement Memberships */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-secondary/70 border border-border text-foreground font-medium">
              <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Coastal Action Front</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary-light font-semibold">{roleLabel}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-card border border-border/60">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Joined {formatDateOnly(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
