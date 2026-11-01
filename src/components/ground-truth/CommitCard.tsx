"use client"

import * as React from "react"
import { GroundTruthCommit } from "@/lib/mocks/ground-truth-data"
import { formatCleanDateTime } from "@/lib/date"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserTier } from "@/lib/schemas/user.schema"
import { Copy, Check, ShieldCheck, MapPin, FileText, CheckSquare, AlertTriangle, Terminal } from "lucide-react"
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

  // Color coding matching specifications:
  // Blue for Announcements
  // Green for Completed Tasks
  // Red for Emergency Alerts
  const eventConfig = {
    announcement: {
      label: "Announcement",
      badgeClass: "bg-cobalt/20 text-[#60A5FA] border-cobalt/50",
      dotClass: "bg-[#255DEE] border-[#60A5FA] ring-cobalt/30",
      accentBarClass: "bg-[#255DEE]",
      icon: FileText,
    },
    task_completed: {
      label: "Completed Task",
      badgeClass: "bg-lime/20 text-[#D4FF24] border-lime/50",
      dotClass: "bg-[#D4FF24] border-white ring-lime/30",
      accentBarClass: "bg-[#D4FF24]",
      icon: CheckSquare,
    },
    emergency_alert: {
      label: "Emergency Alert",
      badgeClass: "bg-tomato/20 text-[#FF6B6B] border-tomato/50",
      dotClass: "bg-[#FF4D2E] border-white ring-tomato/30",
      accentBarClass: "bg-[#FF4D2E]",
      icon: AlertTriangle,
    },
  }[commit.eventType]

  const EventIcon = eventConfig.icon

  return (
    <div className="relative flex items-start gap-4 sm:gap-6 group">
      {/* 1. Timeline vertical track & node dot */}
      <div className="flex flex-col items-center shrink-0 self-stretch">
        <div
          className={`w-4 h-4 rounded-full border-2 ${eventConfig.dotClass} shadow-md ring-4 transition-transform group-hover:scale-110 shrink-0 z-10 mt-5`}
          title={`Block #${commit.proof.blockNumber}`}
        />
        {!isLast && (
          <div className="w-0.5 grow bg-gradient-to-b from-white/30 to-white/10 group-hover:from-lime/50 transition-colors my-1" />
        )}
      </div>

      {/* 2. Main Commit Card */}
      <div
        onClick={() => onSelectAudit(commit)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelectAudit(commit)
          }
        }}
        className="grow mb-6 rounded-chunky border-2 border-white/15 hover:border-lime/60 bg-[#0E1326] hover:bg-[#121830] transition-all p-5 shadow-hard-xs hover:shadow-hard-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
      >
        {/* Card Header: 4 Core Elements */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-white/10">
          {/* Item 2: Color-coded Event Type & Item 4: Cryptographic Hash */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-black uppercase tracking-wider border font-mono ${eventConfig.badgeClass}`}
            >
              <EventIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              {eventConfig.label}
            </span>

            {/* Cryptographic Hash */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-black/60 border border-white/15 font-mono text-xs text-lime">
              <Terminal className="w-3 h-3 text-lime/70" />
              <span className="font-bold">{commit.commitHash}</span>
              <button
                type="button"
                onClick={handleCopyHash}
                aria-label={`Copy hash ${commit.commitHash}`}
                className="p-0.5 hover:text-white text-white/50 hover:bg-white/10 rounded transition-colors ml-1"
                title="Copy hash"
              >
                {copied ? <Check className="w-3 h-3 text-lime" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Item 1: Exact timestamp down to the minute */}
          <div className="text-right">
            <time dateTime={commit.timestamp} className="font-mono text-xs font-semibold text-white/80 tabular-nums">
              {formatCleanDateTime(commit.timestamp)}
            </time>
          </div>
        </div>

        {/* Content Section: Title & Details */}
        <div className="py-3.5 space-y-2">
          <h3 className="text-base sm:text-lg font-black text-white font-sans tracking-tight leading-snug group-hover:text-lime transition-colors">
            {commit.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
            {commit.summary}
          </p>

          {commit.metadata.location && (
            <div className="flex items-center gap-1.5 text-xs text-white/60 pt-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-sun shrink-0" />
              <span>{commit.metadata.location}</span>
              {commit.metadata.sector && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-white/70">{commit.metadata.sector}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Item 3: Author & Trust Tier + Audit Action */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Author & Trust Tier */}
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar name={commit.author.name} avatarUrl={commit.author.avatarUrl} className="w-6 h-6 shrink-0" />
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-bold text-white truncate font-sans">
                {commit.author.name}
              </span>
              <TierBadge tier={commit.author.tier as UserTier} showIcon={false} className="text-[10px] py-0 px-1.5" />
              <span className="text-white/50 text-[11px] hidden sm:inline font-mono">
                ({commit.author.roleTitle})
              </span>
            </div>
          </div>

          {/* Audit Verification Proof Trigger */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-lime flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Proof</span>
            </span>
            <span className="text-white/40 text-[10px] font-mono">
              [block #{commit.proof.blockNumber}]
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
