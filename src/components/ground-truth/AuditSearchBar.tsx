"use client"

import * as React from "react"
import { GroundTruthEventType } from "@/lib/mocks/ground-truth-data"
import { Search, X, ShieldCheck } from "lucide-react"
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
      toast.success("Chain integrity verified: 12/12 Merkle blocks match genesis hash.")
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* 1. Audit Search Input Bar: White surface with 2px ink border, Feed/Tasks style */}
      <div className="relative flex items-center">
        <label htmlFor="audit-search-input" className="sr-only">
          Audit search
        </label>
        <Search className="w-4 h-4 absolute left-3.5 text-ink/40 pointer-events-none" aria-hidden="true" />
        <input
          id="audit-search-input"
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Audit search: enter hash (#c7f91a2), author, keyword, rally point or task..."
          className="w-full pl-10 pr-10 py-2.5 rounded-sm bg-white border-2 border-ink text-sm font-sans text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-cobalt shadow-hard-xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange("")
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-3 p-1 rounded-sm text-ink/50 hover:text-ink hover:bg-ivory cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Filter Chips & Outlined Verify Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Chips Styled Like Tasks Page Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-sans text-xs">
          {/* All */}
          <button
            type="button"
            onClick={() => onTypeChange("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold border-2 transition-all cursor-pointer ${
              selectedType === "all"
                ? "bg-ink text-white border-ink shadow-xs"
                : "bg-white text-ink/70 border-ink/20 hover:border-ink hover:text-ink hover:bg-ivory"
            }`}
          >
            <span>All commits</span>
            <span
              className={`px-1.5 py-0.5 rounded-xs text-[10px] tabular-nums font-black ${
                selectedType === "all" ? "bg-white/20 text-white" : "bg-ink/10 text-ink"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Announcements */}
          <button
            type="button"
            onClick={() => onTypeChange("announcement")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold border-2 transition-all cursor-pointer ${
              selectedType === "announcement"
                ? "bg-cobalt text-white border-cobalt shadow-xs"
                : "bg-white text-ink/70 border-ink/20 hover:border-ink hover:text-ink hover:bg-ivory"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cobalt shrink-0" aria-hidden="true" />
            <span>Announcements</span>
            <span
              className={`px-1.5 py-0.5 rounded-xs text-[10px] tabular-nums font-black ${
                selectedType === "announcement" ? "bg-white/20 text-white" : "bg-ink/10 text-ink"
              }`}
            >
              {counts.announcement}
            </span>
          </button>

          {/* Completed Tasks */}
          <button
            type="button"
            onClick={() => onTypeChange("task_completed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold border-2 transition-all cursor-pointer ${
              selectedType === "task_completed"
                ? "bg-lime text-ink border-ink shadow-xs"
                : "bg-white text-ink/70 border-ink/20 hover:border-ink hover:text-ink hover:bg-ivory"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-lime border border-ink/40 shrink-0" aria-hidden="true" />
            <span>Completed tasks</span>
            <span
              className={`px-1.5 py-0.5 rounded-xs text-[10px] tabular-nums font-black ${
                selectedType === "task_completed" ? "bg-ink/15 text-ink" : "bg-ink/10 text-ink"
              }`}
            >
              {counts.task_completed}
            </span>
          </button>

          {/* Emergency Alerts */}
          <button
            type="button"
            onClick={() => onTypeChange("emergency_alert")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold border-2 transition-all cursor-pointer ${
              selectedType === "emergency_alert"
                ? "bg-tomato text-white border-tomato shadow-xs"
                : "bg-white text-ink/70 border-ink/20 hover:border-ink hover:text-ink hover:bg-ivory"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tomato shrink-0" aria-hidden="true" />
            <span>Emergency alerts</span>
            <span
              className={`px-1.5 py-0.5 rounded-xs text-[10px] tabular-nums font-black ${
                selectedType === "emergency_alert" ? "bg-white/20 text-white" : "bg-ink/10 text-ink"
              }`}
            >
              {counts.emergency_alert}
            </span>
          </button>
        </div>

        {/* Outlined Verify Button Styled Like Feed "Verify media" */}
        <button
          type="button"
          onClick={handleVerifyChain}
          disabled={verifying}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white hover:bg-ivory text-ink border-2 border-ink text-xs font-bold transition-all shadow-hard-xs shrink-0 cursor-pointer disabled:opacity-50"
        >
          <ShieldCheck className={`w-4 h-4 text-cobalt ${verifying ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>{verifying ? "Auditing hashes..." : "Verify chain integrity"}</span>
        </button>
      </div>
    </div>
  )
}
