"use client"

import * as React from "react"
import { Check, ShieldAlert, Sparkles } from "lucide-react"
import { Announcement } from "@/lib/schemas/announcement.schema"
import { AnnouncementSignature } from "@/lib/schemas/signature.schema"
import { User } from "@/lib/schemas/user.schema"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { SignatureChip } from "./SignatureChip"
import { SignConfirmationDialog } from "./SignConfirmationDialog"

export interface AnnouncementCardProps {
  announcement: Announcement
  signatures: AnnouncementSignature[]
  usersMap: Record<string, User>
  currentUserId: string | null
  currentUserTier?: number
  onSign: (announcementId: string) => Promise<void> | void
  onSimulateCoSign?: (announcementId: string) => Promise<void> | void
  isSigning?: boolean
}

export function AnnouncementCard({
  announcement,
  signatures,
  usersMap,
  currentUserId,
  currentUserTier,
  onSign,
  onSimulateCoSign,
  isSigning = false,
}: AnnouncementCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const author = usersMap[announcement.created_by] || {
    id: announcement.created_by,
    display_name: "Movement Organizer",
    avatar_url: null,
    tier: 3 as const,
    created_at: announcement.created_at,
  }

  const isPublished = announcement.is_published
  const isTier3 = currentUserTier === 3
  const hasSigned = currentUserId
    ? signatures.some((sig) => sig.signed_by === currentUserId)
    : false

  const handleConfirmSign = async () => {
    try {
      await onSign(announcement.id)
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <Card
      className={cn(
        "bg-card text-card-foreground shadow-sm transition-all duration-150 overflow-hidden",
        /* Ledger-line distinctiveness element: continuous verification anchor */
        isPublished
          ? "border-l-4 border-l-primary border-t border-r border-b border-border/80"
          : "border-l-4 border-l-amber-500 border-t border-r border-b border-border/80"
      )}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Author metadata */}
          <div className="flex items-center gap-3">
            <UserAvatar
              name={author.display_name}
              avatarUrl={author.avatar_url}
              className="h-9 w-9"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {author.display_name}
                </span>
                <TierBadge tier={author.tier} />
              </div>
              <time
                dateTime={announcement.published_at || announcement.created_at}
                className="text-xs text-muted-foreground block font-mono"
              >
                {formatDateTime(announcement.published_at || announcement.created_at)}
              </time>
            </div>
          </div>

          {/* Signature Stamp Distinctiveness Element */}
          <SignatureChip
            signedCount={signatures.length}
            requiredCount={announcement.required_signatures}
            isVerified={isPublished}
          />
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground pt-1">
          {announcement.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Body content */}
        <p className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {announcement.body}
        </p>

        {/* Cryptographic Signatures Ledger Line Treatment */}
        <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span className="font-medium text-foreground uppercase tracking-wider text-[11px]">
              Co-Signatures Ledger
            </span>
            <span>
              {signatures.length} of {announcement.required_signatures} verified
            </span>
          </div>

          {signatures.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No signatures recorded yet.
            </p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {signatures.map((sig) => {
                const signer = usersMap[sig.signed_by] || {
                  id: sig.signed_by,
                  display_name: "Organizer",
                  avatar_url: null,
                  tier: 3 as const,
                  created_at: sig.signed_at,
                }

                return (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-sm bg-background/50 border border-border/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={signer.display_name}
                        avatarUrl={signer.avatar_url}
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="font-medium truncate text-foreground">
                        {signer.display_name}
                      </span>
                      <TierBadge tier={signer.tier} />
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {formatDateTime(sig.signed_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>

      {/* Card Footer with Sign & Simulation Actions (Visible on Pending Items) */}
      {!isPublished && (
        <CardFooter className="pt-2 pb-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Pending {Math.max(0, announcement.required_signatures - signatures.length)} organizer co-signature
              {announcement.required_signatures - signatures.length === 1 ? "" : "s"}.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasSigned && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium bg-muted text-muted-foreground border border-border/80">
                <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>Signed by You</span>
              </span>
            )}

            {!hasSigned && isTier3 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                loading={isSigning}
                disabled={isSigning}
                className="text-xs"
              >
                Sign Announcement
              </Button>
            )}

            {onSimulateCoSign && signatures.length < announcement.required_signatures && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSimulateCoSign(announcement.id)}
                disabled={isSigning}
                className="gap-1.5 text-xs border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-foreground"
                aria-label="Simulate co-signature by another organizer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>Simulate Co-Sign</span>
              </Button>
            )}
          </div>
        </CardFooter>
      )}

      {/* Confirmation Dialog */}
      <SignConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSign}
        isPending={isSigning}
        announcementTitle={announcement.title}
      />
    </Card>
  )
}
