import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Shield, Award, UserCheck } from "lucide-react"
import { UserTier } from "@/lib/schemas/user.schema"
import { cn } from "@/lib/utils"

export interface TierBadgeProps {
  tier: UserTier
  className?: string
  showIcon?: boolean
}

export function TierBadge({ tier, className, showIcon = true }: TierBadgeProps) {
  if (tier === 3) {
    return (
      <Badge
        variant="default"
        className={cn(
          "bg-primary text-primary-foreground font-medium rounded-sm border-primary gap-1",
          className
        )}
      >
        {showIcon && <Shield className="h-3 w-3" aria-hidden="true" />}
        <span>Tier 3 Organizer</span>
      </Badge>
    )
  }

  if (tier === 2) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-caution text-caution bg-caution-bg/40 font-medium rounded-sm gap-1",
          className
        )}
      >
        {showIcon && <Award className="h-3 w-3" aria-hidden="true" />}
        <span>Tier 2 Senior Volunteer</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "bg-secondary text-secondary-foreground font-medium rounded-sm border-border gap-1",
        className
      )}
    >
      {showIcon && <UserCheck className="h-3 w-3" aria-hidden="true" />}
      <span>Tier 1 Volunteer</span>
    </Badge>
  )
}
