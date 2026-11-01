"use client"

import * as React from "react"
import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, ShieldAlert } from "lucide-react"
import { Task } from "@/lib/schemas/task.schema"
import { TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { VERIFICATION_RULES } from "@/lib/permissions"
import { formatDateTime } from "@/lib/date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"

export interface VerifyTaskDialogProps {
  task: Task
  claim: TaskClaim
  verifications: PeerVerification[]
  usersMap: Record<string, User>
  currentUserId: string | null
  currentUserTier?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onPeerVote: (vote: "approve" | "reject") => Promise<void> | void
  onOrganizerOverride: (approve: boolean, note?: string) => Promise<void> | void
  isPending: boolean
}

export function VerifyTaskDialog({
  task,
  claim,
  verifications,
  usersMap,
  currentUserId,
  currentUserTier,
  open,
  onOpenChange,
  onPeerVote,
  onOrganizerOverride,
  isPending,
}: VerifyTaskDialogProps) {
  const [overrideNote, setOverrideNote] = React.useState("")
  const claimant = usersMap[claim.claimed_by] || {
    id: claim.claimed_by,
    display_name: "Volunteer Claimant",
    avatar_url: null,
    tier: 1 as const,
    created_at: claim.claimed_at,
  }

  const isClaimant = currentUserId === claim.claimed_by
  const isTier3 = currentUserTier === 3

  // Check if current user is an assigned peer verifier
  const myVerification = currentUserId
    ? verifications.find((v) => v.verifier_id === currentUserId)
    : undefined
  const isAssignedVerifier = Boolean(myVerification)
  const hasVoted = Boolean(myVerification && myVerification.vote !== null)

  // Calculate vote counts
  const approvalsCount = verifications.filter((v) => v.vote === "approve").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] tabular-nums font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/25">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Demo: Peer Verification Protocol
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Verify Task: {task.title}
          </DialogTitle>
          <DialogDescription>
            Decentralized consensus verification. Reaching {VERIFICATION_RULES.approvalThreshold} of{" "}
            {VERIFICATION_RULES.requiredVerifiers} peer approvals confirms completion and awards{" "}
            {task.reward_points} PTS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 text-sm">
          {/* Claimant Completion Summary */}
          <div className="p-3.5 rounded-md bg-muted/30 border border-border/80 space-y-2">
            <div className="text-xs tabular-nums text-muted-foreground uppercase tracking-wider">
              Completed Claim Submission
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  name={claimant.display_name}
                  avatarUrl={claimant.avatar_url}
                  className="h-8 w-8 text-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {claimant.display_name}
                    </span>
                    <TierBadge tier={claimant.tier} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Completed {formatDateTime(claim.completed_at || claim.claimed_at)}
                  </span>
                </div>
              </div>
              <span className="tabular-nums text-xs font-bold px-2 py-1 rounded-sm bg-primary/10 text-primary border border-primary/30">
                +{task.reward_points} PTS
              </span>
            </div>

            {claim.note && (
              <div className="pt-2 text-xs text-foreground/90 bg-background/60 p-2.5 rounded-sm border border-border/40">
                <span className="font-medium text-muted-foreground block mb-0.5">
                  Claimant Notes:
                </span>
                {claim.note}
              </div>
            )}
          </div>

          {/* Assigned Verifiers Consensus Status */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="font-semibold text-foreground uppercase tracking-wider">
                Assigned Peer Verifiers ({verifications.length})
              </span>
              <span className="text-primary font-medium">
                {approvalsCount} / {VERIFICATION_RULES.approvalThreshold} Approvals Required
              </span>
            </div>

            <div className="space-y-1.5">
              {verifications.map((v) => {
                const verifierUser = usersMap[v.verifier_id] || {
                  id: v.verifier_id,
                  display_name: "Selected Verifier",
                  avatar_url: null,
                  tier: 1 as const,
                  created_at: v.assigned_at,
                }

                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-sm bg-card border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={verifierUser.display_name}
                        avatarUrl={verifierUser.avatar_url}
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="font-medium truncate text-foreground">
                        {verifierUser.display_name}
                      </span>
                      <TierBadge tier={verifierUser.tier} />
                    </div>

                    <div className="shrink-0 tabular-nums text-[11px]">
                      {v.vote === "approve" && (
                        <span className="inline-flex items-center gap-1 text-lime font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Approved
                        </span>
                      )}
                      {v.vote === "reject" && (
                        <span className="inline-flex items-center gap-1 text-destructive font-medium">
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Rejected
                        </span>
                      )}
                      {v.vote === null && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          Pending Vote
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rule Enforcement: Claimant can NEVER verify their own task */}
          {isClaimant && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Conflict of Interest Rule:</p>
                <p className="text-foreground/80 mt-0.5">
                  You are the claimant for this task. Claimants can never cast a verification vote on their own completion.
                </p>
              </div>
            </div>
          )}

          {/* Peer Verifier Voting Section */}
          {!isClaimant && isAssignedVerifier && (
            <div className="p-3.5 rounded-md bg-card border border-primary/30 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <h4 className="font-semibold text-sm text-foreground">
                  Your Peer Verification Vote
                </h4>
              </div>

              {hasVoted ? (
                <p className="text-xs text-muted-foreground">
                  You have already submitted your vote (
                  <strong className="text-foreground capitalize">{myVerification?.vote}</strong>
                  ). Votes are tamper-evident and cannot be modified.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    loading={isPending}
                    disabled={isPending}
                    onClick={() => onPeerVote("approve")}
                    className="gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Approve Task (+1 Vote)
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    loading={isPending}
                    disabled={isPending}
                    onClick={() => onPeerVote("reject")}
                    className="gap-1.5 text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Reject Completion
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tier 3 Organizer Override Section */}
          {isTier3 && (
            <div className="p-3.5 rounded-md bg-sun/20 border border-sun/40 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sun shrink-0" aria-hidden="true" />
                <h4 className="font-semibold text-sm text-foreground">
                  Organizer Override (Tier 3 Only)
                </h4>
              </div>

              <p className="text-xs text-muted-foreground">
                As a Tier 3 Organizer, you can unilaterally approve or reject task claims to resolve delays or disputes.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="organizer-override-note" className="text-xs">
                  Override Decision Note (Optional)
                </Label>
                <Textarea
                  id="organizer-override-note"
                  placeholder="Record reason for override decision in audit ledger..."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  disabled={isPending}
                  className="min-h-[70px] text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  loading={isPending}
                  disabled={isPending}
                  onClick={() => onOrganizerOverride(true, overrideNote)}
                  className="text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Approve (Organizer Override)
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  loading={isPending}
                  disabled={isPending}
                  onClick={() => onOrganizerOverride(false, overrideNote)}
                  className="text-xs gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Reject (Organizer Override)
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
