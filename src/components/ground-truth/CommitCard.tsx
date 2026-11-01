"use client"

import * as React from "react"
import { GroundTruthCommit } from "@/lib/mocks/ground-truth-data"
import { formatCleanDateTime } from "@/lib/date"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserTier } from "@/lib/schemas/user.schema"
import { Copy, Check, ShieldCheck, MapPin, FileText, CheckSquare, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export interface CommitCardProps {
  commit: GroundTruthCommit
  onSelectAudit: (commit: GroundTruthCommit) => void
  isLast?: boolean
}

export function CommitCard({ commit, onSelectAudit, isLast = false }: CommitCardProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(commit.commitHash)
      setCopied(true)
      toast.success(`Copied ${commit.commitHash} to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Type styling matching Feed dispatch:
  // Announcement: cobalt strip & chip
  // Completed task: lime strip & chip
  // Emergency alert: tomato strip & chip
  const eventConfig = {
    announcement: {
      label: "Announcement",
      borderLeftClass: "border-l-8 border-l-cobalt",
      badgeClass: "bg-cobalt text-white border border-cobalt",
      dotClass: "bg-white border-2 border-cobalt ring-2 ring-cobalt/20",
      icon: FileText,
    },
    task_completed: {
      label: "Completed task",
      borderLeftClass: "border-l-8 border-l-lime",
      badgeClass: "bg-lime text-ink border border-ink font-bold",
      dotClass: "bg-lime border-2 border-ink ring-2 ring-lime/20",
      icon: CheckSquare,
    },
    emergency_alert: {
      label: "Emergency alert",
      borderLeftClass: "border-l-8 border-l-tomato",
      badgeClass: "bg-tomato text-white border border-tomato",
      dotClass: "bg-white border-2 border-tomato ring-2 ring-tomato/20",
      icon: AlertTriangle,
    },
  }[commit.eventType]

  const EventIcon = eventConfig.icon

  return (
    <div className="relative flex items-start gap-3 sm:gap-5 group">
      {/* 1. Timeline vertical track & node dot */}
      <div className="flex flex-col items-center shrink-0 self-stretch">
        <div
          className={`w-3.5 h-3.5 rounded-full ${eventConfig.dotClass} shrink-0 z-10 mt-6`}
          title={`Block #${commit.proof.blockNumber}`}
        />
        {!isLast && (
          <div className="w-0.5 grow bg-ink/15 group-hover:bg-ink/30 transition-colors my-1" />
        )}
      </div>

      {/* 2. Main Entry Row (Styled Like Feed Dispatch Row) */}
      <article
        onClick={() => onSelectAudit(commit)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelectAudit(commit)
          }
        }}
        className={`grow mb-6 p-5 sm:p-6 bg-white border-2 border-ink shadow-hard-sm hover:shadow-hard transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${eventConfig.borderLeftClass}`}
      >
        {/* Header Row: 4 Core Elements */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink/10">
          {/* Item 2: Color-coded Event Type & Item 4: Cryptographic Hash */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans ${eventConfig.badgeClass}`}
            >
              <EventIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{eventConfig.label}</span>
            </span>

            {/* Cryptographic Hash: Normal font, tabular numerals, with small outlined copy button */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-ivory border border-ink/20 font-sans text-xs text-ink tabular-nums">
              <span className="font-bold">{commit.commitHash}</span>
              <button
                type="button"
                onClick={handleCopyHash}
                aria-label={`Copy hash ${commit.commitHash}`}
                className="p-0.5 hover:bg-white rounded border border-transparent hover:border-ink/20 text-ink/60 hover:text-ink transition-colors ml-0.5 cursor-pointer"
                title="Copy hash"
              >
                {copied ? <Check className="w-3 h-3 text-cobalt" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Item 1: Exact timestamp down to the minute */}
          <time dateTime={commit.timestamp} className="font-sans text-xs font-semibold text-ink/60 tabular-nums">
            {formatCleanDateTime(commit.timestamp)}
          </time>
        </div>

        {/* Content Section: Title & Details */}
        <div className="py-3.5 space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-ink font-sans tracking-tight leading-snug">
            {commit.title}
          </h2>
          <p className="text-sm text-ink/90 leading-relaxed font-sans">
            {commit.summary}
          </p>

          {commit.metadata.location && (
            <div className="flex items-center gap-1.5 text-xs text-ink/60 pt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-sun shrink-0" aria-hidden="true" />
              <span>{commit.metadata.location}</span>
              {commit.metadata.sector && (
                <>
                  <span className="text-ink/30">•</span>
                  <span className="text-ink/70">{commit.metadata.sector}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Row: Item 3: Author & Trust Tier + Audit Action */}
        <div className="pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Author & Trust Tier */}
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar name={commit.author.name} avatarUrl={commit.author.avatarUrl} className="w-7 h-7 shrink-0 text-xs" />
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-bold text-ink truncate font-sans">
                {commit.author.name}
              </span>
              <TierBadge tier={commit.author.tier as UserTier} />
            </div>
          </div>

          {/* Audit Verification Proof Trigger */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border-2 border-ink bg-ivory hover:bg-white text-xs font-bold text-ink shadow-hard-xs transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt" aria-hidden="true" />
              <span>Audit proof</span>
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
