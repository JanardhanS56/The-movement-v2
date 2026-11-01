"use client"

import * as React from "react"
import {
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react"
import { Task } from "@/lib/schemas/task.schema"
import { TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { formatCleanDateTime, formatDateTime } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { StatusLabel } from "@/components/shared/StatusLabel"
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

  // Determine if this task needs the current user's action
  const needsYou =
    (isInProgress && isClaimant) ||
    (isPendingVerification && canVerify)

  // Status strip color on the left
  const getStatusStripClass = () => {
    if (needsYou) return "border-l-8 border-l-tomato"
    if (isCompleted) return "border-l-8 border-l-lime"
    if (isPendingVerification) return "border-l-8 border-l-lavender"
    if (isInProgress) return "border-l-8 border-l-sun"
    return "border-l-8 border-l-cobalt"
  }

  const cleanCreatedTime = formatCleanDateTime(task.created_at)
  const exactCreatedTime = formatDateTime(task.created_at)
  const hasLongDescription = (task.description?.length || 0) > 90

  return (
    <article
      aria-labelledby={`task-${task.id}-title`}
      className={`p-6 bg-white border-2 border-ink shadow-hard-sm transition-all ${getStatusStripClass()} ${
        needsYou ? "ring-2 ring-tomato" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left Side: Status, Title, Description, Claimant */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Status Label + Optional Needs You Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusLabel status={task.status} />

            {needsYou && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-tomato text-white border border-ink text-xs font-bold shadow-hard-xs animate-pulse">
                Needs you
              </span>
            )}

            <time
              dateTime={task.created_at}
              title={exactCreatedTime}
              className="text-xs text-ink/60 font-semibold cursor-help ml-auto md:ml-0"
            >
              {cleanCreatedTime}
            </time>
          </div>

          {/* Task Title */}
          <h3
            id={`task-${task.id}-title`}
            className={`text-lg md:text-xl font-black tracking-tight font-sans text-ink ${
              isCompleted ? "line-through text-ink/60" : ""
            }`}
          >
            {task.title}
          </h3>

          {/* Expandable Description */}
          {task.description && (
            <div className="space-y-1">
              <p
                className={`text-sm text-ink/80 leading-relaxed max-w-prose ${
                  !isExpanded && hasLongDescription ? "line-clamp-2" : ""
                }`}
              >
                {task.description}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cobalt hover:underline focus:outline-none"
                >
                  <span>{isExpanded ? "Show less" : "Read more"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Claimant / Creator info row */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs border-t border-ink/10 text-ink/70">
            {claimant ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink/60">Claimant:</span>
                <UserAvatar
                  name={claimant.display_name}
                  avatarUrl={claimant.avatar_url}
                  className="h-6 w-6 text-xs"
                />
                <span className="font-bold text-ink truncate max-w-[140px]">
                  {claimant.display_name}
                </span>
                <TierBadge tier={claimant.tier} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-semibold">
                <Users className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
                <span>
                  {task.required_volunteers} volunteer slot
                  {task.required_volunteers === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {isCreator && (
              <span className="text-xs text-ink/50 font-medium italic">
                Created by you
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Giant Points Numeral & Exactly ONE Action */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-ink/10">
          {/* Giant Points Numeral */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-black tabular-nums text-ink font-sans tracking-tight">
                +{task.reward_points}
              </span>
              <span className="text-xs font-bold text-ink/60">pts</span>
            </div>
            <div className="text-xs font-semibold text-ink/50 hidden md:block">
              reward score
            </div>
          </div>

          {/* ONE Action Button / Stamp */}
          <div className="flex items-center justify-end">
            {/* State 1: Open task -> Claim */}
            {isOpen && (
              <>
                {isCreator ? (
                  <span className="text-xs text-ink/50 font-medium italic">
                    Created by you
                  </span>
                ) : isClaimant ? (
                  <span className="text-xs text-ink/70 font-bold bg-ivory px-3 py-1.5 rounded-sm border border-ink">
                    Claimed by you
                  </span>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onClaim(task.id)}
                    loading={isClaiming}
                    disabled={isClaiming}
                    className="text-xs font-bold bg-lime text-ink border-2 border-ink shadow-hard-sm hover:bg-lime/90 hover:shadow-hard px-4 h-9"
                  >
                    Claim task
                  </Button>
                )}
              </>
            )}

            {/* State 2: In progress task -> Mark Complete */}
            {isInProgress && (
              <>
                {isClaimant && claim ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onMarkComplete(claim.id)}
                    loading={isCompleting}
                    disabled={isCompleting}
                    className="text-xs font-bold bg-lime text-ink border-2 border-ink shadow-hard-sm hover:bg-lime/90 hover:shadow-hard gap-2 px-4 h-9"
                  >
                    <CheckCircle2 className="w-4 h-4 text-ink" aria-hidden="true" />
                    <span>Mark complete</span>
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-ink/70 bg-ivory px-3 py-1.5 rounded-sm border border-ink">
                    In progress by volunteer
                  </span>
                )}
              </>
            )}

            {/* State 3: Pending verification -> Verify */}
            {isPendingVerification && claim && (
              <>
                {canVerify ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setVerifyOpen(true)}
                    loading={isVerifying}
                    disabled={isVerifying}
                    className="text-xs font-bold bg-lime text-ink border-2 border-ink shadow-hard-sm hover:bg-lime/90 hover:shadow-hard gap-2 px-4 h-9"
                  >
                    <ShieldCheck className="w-4 h-4 text-ink" aria-hidden="true" />
                    <span>Verify task</span>
                  </Button>
                ) : isClaimant ? (
                  <span className="text-xs font-bold text-ink bg-sun px-3 py-1.5 rounded-sm border-2 border-ink shadow-hard-xs">
                    Awaiting peer verifiers
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-ink/70 bg-ivory px-3 py-1.5 rounded-sm border border-ink">
                    Peer review in progress
                  </span>
                )}
              </>
            )}

            {/* State 4: Completed -> Verified stamp */}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-lime text-ink border-2 border-ink shadow-hard-xs text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
                <span>Verified & credited</span>
              </span>
            )}
          </div>
        </div>
      </div>

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
    </article>
  )
}
