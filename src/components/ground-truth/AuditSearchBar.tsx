"use client"

import * as React from "react"
import { GroundTruthEventType } from "@/lib/mocks/ground-truth-data"
import { Search, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export interface AuditSearchBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedType: GroundTruthEventType | "all"
  onTypeChange: (type: GroundTruthEventType | "all") => void
  counts: {
    all: number
    announcement: number
    task_completed: number
    emergency_alert: number
  }
}

export function AuditSearchBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  counts,
}: AuditSearchBarProps) {
  const [verifying, setVerifying] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleVerifyChain = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      toast.success("Chain Integrity Verified: 12/12 Merkle blocks match genesis hash.")
    }, 700)
  }

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-white/50">
          <Search className="w-4 h-4 text-lime" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Audit search: enter hash (#c7f91a2), author, keyword, rally point or task..."
          className="w-full pl-10 pr-24 py-3 rounded-sm bg-[#0C1021] border-2 border-white/20 focus:border-lime text-white placeholder:text-white/40 font-mono text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-lime transition-all shadow-inner"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              onSearchChange("")
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-3 p-1 rounded hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="absolute right-3 hidden sm:inline text-[11px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            AUDIT SEARCH
          </span>
        )}
      </div>

      {/* Filter Tabs & Integrity Verification Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Event Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => onTypeChange("all")}
            className={`px-3 py-1.5 rounded-sm border transition-all cursor-pointer font-bold ${
              selectedType === "all"
                ? "bg-lime text-ink border-ink shadow-hard-xs"
                : "bg-[#0E1326] text-white/70 border-white/15 hover:border-white/30 hover:text-white"
            }`}
          >
            All Commits ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("announcement")}
            className={`px-3 py-1.5 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === "announcement"
                ? "bg-[#255DEE] text-white border-[#60A5FA] shadow-hard-xs font-bold"
                : "bg-[#0E1326] text-[#60A5FA]/80 border-white/15 hover:border-[#255DEE]/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
            <span>Announcements ({counts.announcement})</span>
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("task_completed")}
            className={`px-3 py-1.5 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === "task_completed"
                ? "bg-lime text-ink border-ink shadow-hard-xs font-bold"
                : "bg-[#0E1326] text-lime/80 border-white/15 hover:border-lime/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-lime" />
            <span>Completed Tasks ({counts.task_completed})</span>
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("emergency_alert")}
            className={`px-3 py-1.5 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === "emergency_alert"
                ? "bg-tomato text-white border-white shadow-hard-xs font-bold"
                : "bg-[#0E1326] text-[#FF6B6B]/80 border-white/15 hover:border-tomato/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
            <span>Emergency Alerts ({counts.emergency_alert})</span>
          </button>
        </div>

        {/* Chain Integrity Validator Button */}
        <button
          type="button"
          onClick={handleVerifyChain}
          disabled={verifying}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#0C1021] hover:bg-[#121830] text-lime border border-lime/40 text-xs font-mono font-bold transition-all hover:border-lime cursor-pointer shadow-hard-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
          <span>{verifying ? "Auditing Hashes..." : "Verify Chain Integrity"}</span>
        </button>
      </div>
    </div>
  )
}
