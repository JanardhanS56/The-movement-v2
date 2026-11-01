"use client"

import * as React from "react"
import { Check, Sparkles, FileSignature } from "lucide-react"
import { Announcement } from "@/lib/schemas/announcement.schema"
import { AnnouncementSignature } from "@/lib/schemas/signature.schema"
import { User } from "@/lib/schemas/user.schema"
import { formatCleanDateTime, formatDateTime } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { StatusLabel } from "@/components/shared/StatusLabel"
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

  const emptySlotsCount = Math.max(
    0,
    announcement.required_signatures - signatures.length
  )

  const handleConfirmSign = async () => {
    try {
      await onSign(announcement.id)
    } finally {
      setConfirmOpen(false)
    }
  }

  const exactCreatedTime = formatDateTime(announcement.published_at || announcement.created_at)
  const cleanCreatedTime = formatCleanDateTime(announcement.published_at || announcement.created_at)

  return (
    <article
      aria-labelledby={`announcement-${announcement.id}-title`}
      className={`p-6 bg-white border-2 border-ink shadow-hard-sm transition-all relative ${
        isPublished ? "border-l-8 border-l-cobalt" : "border-l-8 border-l-sun"
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={author.display_name}
            avatarUrl={author.avatar_url}
            className="h-10 w-10 text-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-ink font-sans">
                {author.display_name}
              </span>
              <TierBadge tier={author.tier} />
            </div>
            <time
              dateTime={announcement.published_at || announcement.created_at}
              title={exactCreatedTime}
              className="text-xs text-ink/60 font-semibold block cursor-help"
            >
              {cleanCreatedTime}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPublished ? (
            <StatusLabel status="completed" label="Published" />
          ) : (
            <StatusLabel status="pending" label="Pending co-signatures" />
          )}
        </div>
      </div>

      {/* Title & Body */}
      <div className="py-4 space-y-3">
        <h3
          id={`announcement-${announcement.id}-title`}
          className="text-xl font-black text-ink font-sans tracking-tight"
        >
          {announcement.title}
        </h3>
        <p className="text-base text-ink/90 leading-relaxed max-w-prose whitespace-pre-wrap">
          {announcement.body}
        </p>
      </div>

      {/* Stamp Row for Signatures */}
      <div className="pt-4 border-t border-ink/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-ink">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-cobalt" aria-hidden="true" />
            <span>Co-signatures</span>
          </div>
          <span className="font-semibold text-ink/70">
            {signatures.length} of {announcement.required_signatures} signed
          </span>
        </div>

        {/* Stamps & Empty Slot Circles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {signatures.map((sig) => {
            const signer = usersMap[sig.signed_by] || {
              id: sig.signed_by,
              display_name: "Organizer",
              avatar_url: null,
              tier: 3 as const,
              created_at: sig.signed_at,
            }
            const exactSigTime = formatDateTime(sig.signed_at)
            const cleanSigTime = formatCleanDateTime(sig.signed_at)

            return (
              <div
                key={sig.id}
                title={`Signed by ${signer.display_name} at ${exactSigTime}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-lime text-ink border-2 border-ink shadow-hard-xs text-xs font-bold"
              >
                <span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-xs font-black">
                  {signer.display_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>{signer.display_name}</span>
                <span className="text-ink/60 font-semibold">• {cleanSigTime}</span>
              </div>
            )
          })}

          {/* Dashed circles for pending slots */}
          {Array.from({ length: emptySlotsCount }).map((_, i) => (
            <div
              key={`empty-slot-${i}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-dashed border-ink/40 text-ink/60 text-xs font-semibold"
            >
              <span className="w-5 h-5 rounded-full border-2 border-dashed border-ink/40 flex items-center justify-center text-xs">
                +
              </span>
              <span>Awaiting signature</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Bar for Pending Items */}
      {!isPublished && (
        <div className="mt-5 pt-4 border-t-2 border-ink/10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-semibold text-ink/80 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-sun" aria-hidden="true" />
            <span>
              Pending {emptySlotsCount} organizer co-signature
              {emptySlotsCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasSigned && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-white text-ink border-2 border-ink shadow-hard-xs">
                <Check className="w-4 h-4 text-cobalt" aria-hidden="true" />
                <span>Signed by you</span>
              </span>
            )}

            {!hasSigned && isTier3 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                loading={isSigning}
                disabled={isSigning}
                className="text-xs font-bold bg-lime text-ink border-2 border-ink shadow-hard-sm hover:bg-lime/90 hover:shadow-hard px-4 h-9"
              >
                Sign announcement
              </Button>
            )}

            {onSimulateCoSign && emptySlotsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSimulateCoSign(announcement.id)}
                disabled={isSigning}
                className="gap-1.5 text-xs font-bold border-2 border-ink bg-sun text-ink hover:bg-sun/90 shadow-hard-xs h-9 px-3"
                aria-label="Simulate co-signature by another organizer"
              >
                <Sparkles className="w-3.5 h-3.5 text-ink shrink-0" aria-hidden="true" />
                <span>Simulate co-sign</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <SignConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSign}
        isPending={isSigning}
        announcementTitle={announcement.title}
      />
    </article>
  )
}
