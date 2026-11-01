"use client"

import * as React from "react"
import {
  Compass,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Task } from "@/lib/schemas/task.schema"
import { TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { VerifyTaskDialog } from "./VerifyTaskDialog"

export interface TaskCardProps {
  task: Task
  claim?: TaskClaim
  verifications?: PeerVerification[]
  usersMap: Record<string, User>
  currentUserId: string | null
  currentUserTier?: number
  onClaim: (taskId: string) => Promise<void> | void
  onMarkComplete: (claimId: string) => Promise<void> | void
  onPeerVote: (claimId: string, vote: "approve" | "reject") => Promise<void> | void
  onOrganizerOverride: (claimId: string, approve: boolean, note?: string) => Promise<void> | void
  isClaiming?: boolean
  isCompleting?: boolean
  isVerifying?: boolean
}

export function TaskCard({
  task,
  claim,
  verifications = [],
  usersMap,
  currentUserId,
  currentUserTier,
  onClaim,
  onMarkComplete,
  onPeerVote,
  onOrganizerOverride,
  isClaiming = false,
  isCompleting = false,
  isVerifying = false,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [verifyOpen, setVerifyOpen] = React.useState(false)

  const isCompleted = task.status === "completed"
  const isPendingVerification = task.status === "pending_verification"
  const isInProgress = task.status === "in_progress"
  const isOpen = task.status === "open"

  const claimant = claim ? usersMap[claim.claimed_by] : undefined
  const isClaimant = Boolean(currentUserId && claim?.claimed_by === currentUserId)
  const isCreator = Boolean(currentUserId && task.created_by === currentUserId)
  const isTier3 = currentUserTier === 3

  // Verification status
  const isAssignedVerifier = Boolean(
    currentUserId && verifications.some((v) => v.verifier_id === currentUserId)
  )
  const canVerify = (isAssignedVerifier && !isClaimant) || isTier3

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (task.status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-primary/10 text-primary border border-primary/25">
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open</span>
          </span>
        )
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-sun/20 text-sun border border-sun/40">
            <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>In Progress</span>
          </span>
        )
      case "pending_verification":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-accent/20 text-accent border border-accent/35">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Pending Verification</span>
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-lime/20 text-lime border border-lime/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Completed</span>
          </span>
        )
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium bg-muted text-muted-foreground border border-border">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancelled</span>
          </span>
        )
      default:
        return null
    }
  }

  // Visual variety styling based on density and completion
  const cardBorderClasses = isCompleted
    ? "border-l-4 border-l-lime bg-muted/25 border-t border-r border-b border-border/70"
    : isPendingVerification
    ? "border-l-4 border-l-accent bg-card border-t border-r border-b border-border/80"
    : isInProgress
    ? "border-l-4 border-l-sun bg-card border-t border-r border-b border-border/80"
    : "border-l-4 border-l-primary/60 bg-card border-t border-r border-b border-border/80"

  const hasLongDescription = (task.description?.length || 0) > 85

  return (
    <Card
      className={cn(
        "text-card-foreground shadow-sm transition-all duration-150 flex flex-col justify-between overflow-hidden",
        cardBorderClasses
      )}
    >
      <div>
        <CardHeader className="pb-3 space-y-2.5">
          {/* Header row: Status badge + Reward points */}
          <div className="flex items-center justify-between gap-3">
            {renderStatusBadge()}

            {/* Reward Points Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs tabular-nums font-bold border",
                task.reward_points >= 60
                  ? "bg-primary/20 text-primary border-primary/40 shadow-xs"
                  : "bg-muted/80 text-foreground/90 border-border"
              )}
            >
              <Award className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>+{task.reward_points} PTS</span>
            </span>
          </div>

          {/* Task Title */}
          <h3
            className={cn(
              "font-bold text-base sm:text-lg tracking-tight",
              isCompleted ? "text-foreground/90 line-through decoration-muted-foreground/60" : "text-foreground"
            )}
          >
            {task.title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-3 pt-0 pb-3">
          {/* 2-line Description with 'Read more' toggle */}
          {task.description && (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-xs sm:text-sm text-muted-foreground leading-relaxed",
                  !isExpanded && hasLongDescription && "line-clamp-2"
                )}
              >
                {task.description}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <span>{isExpanded ? "Show less" : "Read more"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3 h-3" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Distinct Ledger-Row Treatment for Completed Tasks */}
          {isCompleted && (
            <div className="p-2.5 rounded-sm bg-background/50 border border-lime/40 text-xs tabular-nums space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="uppercase text-[11px] text-lime font-semibold">
                  Verification Ledger Stamped
                </span>
                <span>{formatDateTime(claim?.verified_at || task.created_at)}</span>
              </div>
              <p className="text-[11px] text-foreground/80">
                Reward points credited to claimant impact profile.
              </p>
            </div>
          )}

          {/* Claimant / Volunteers info row */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-border/40">
            {claimant ? (
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar
                  name={claimant.display_name}
                  avatarUrl={claimant.avatar_url}
                  className="h-6 w-6 text-[10px]"
                />
                <div className="min-w-0 flex items-center gap-1.5 truncate">
                  <span className="font-medium text-foreground truncate">
                    {claimant.display_name}
                  </span>
                  <TierBadge tier={claimant.tier} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {task.required_volunteers} volunteer slot
                  {task.required_volunteers === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
              {formatDateTime(task.created_at)}
            </span>
          </div>
        </CardContent>
      </div>

      {/* Primary Action Button */}
      <CardFooter className="pt-2 pb-4 border-t border-border/40 flex items-center justify-end gap-2">
        {/* State 1: Open task -> Claim */}
        {isOpen && (
          <div>
            {isCreator ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs opacity-75 cursor-not-allowed"
              >
                Created by You
              </Button>
            ) : isClaimant ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs opacity-75 cursor-not-allowed"
              >
                Already Claimed
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onClaim(task.id)}
                loading={isClaiming}
                disabled={isClaiming}
                className="text-xs"
              >
                Claim Task
              </Button>
            )}
          </div>
        )}

        {/* State 2: In progress task -> Mark Complete (current claimant only) */}
        {isInProgress && (
          <div>
            {isClaimant && claim ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => onMarkComplete(claim.id)}
                loading={isCompleting}
                disabled={isCompleting}
                className="text-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mark Complete</span>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">
                Assigned to volunteer
              </span>
            )}
          </div>
        )}

        {/* State 3: Pending verification -> Verify (verifier or Tier 3) */}
        {isPendingVerification && claim && (
          <div>
            {canVerify ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setVerifyOpen(true)}
                loading={isVerifying}
                disabled={isVerifying}
                className="text-xs gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verify Task</span>
              </Button>
            ) : isClaimant ? (
              <span className="text-xs text-sun tabular-nums">
                Awaiting peer verifiers
              </span>
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">
                Peer review in progress
              </span>
            )}
          </div>
        )}

        {/* State 4: Completed -> Verified stamp */}
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-xs text-lime tabular-nums font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Verified & Credited
          </span>
        )}
      </CardFooter>

      {/* Verification Dialog */}
      {claim && (
        <VerifyTaskDialog
          task={task}
          claim={claim}
          verifications={verifications}
          usersMap={usersMap}
          currentUserId={currentUserId}
          currentUserTier={currentUserTier}
          open={verifyOpen}
          onOpenChange={setVerifyOpen}
          onPeerVote={async (vote) => {
            await onPeerVote(claim.id, vote)
            setVerifyOpen(false)
          }}
          onOrganizerOverride={async (approve, note) => {
            await onOrganizerOverride(claim.id, approve, note)
            setVerifyOpen(false)
          }}
          isPending={isVerifying}
        />
      )}
    </Card>
  )
}
