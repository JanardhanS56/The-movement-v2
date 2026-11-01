"use client"

import * as React from "react"
import { GROUND_TRUTH_COMMITS, GroundTruthCommit, GroundTruthEventType } from "@/lib/mocks/ground-truth-data"
import { GroundTruthHeader } from "@/components/ground-truth/GroundTruthHeader"
import { AuditSearchBar } from "@/components/ground-truth/AuditSearchBar"
import { CommitCard } from "@/components/ground-truth/CommitCard"
import { CommitAuditModal } from "@/components/ground-truth/CommitAuditModal"
import { Terminal, GitCommit, FileQuestion } from "lucide-react"

export default function GroundTruthPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedType, setSelectedType] = React.useState<GroundTruthEventType | "all">("all")
  const [auditCommit, setAuditCommit] = React.useState<GroundTruthCommit | null>(null)
  const [isAuditOpen, setIsAuditOpen] = React.useState(false)

  // Compute counts
  const counts = React.useMemo(() => {
    return {
      all: GROUND_TRUTH_COMMITS.length,
      announcement: GROUND_TRUTH_COMMITS.filter((c) => c.eventType === "announcement").length,
      task_completed: GROUND_TRUTH_COMMITS.filter((c) => c.eventType === "task_completed").length,
      emergency_alert: GROUND_TRUTH_COMMITS.filter((c) => c.eventType === "emergency_alert").length,
    }
  }, [])

  // Filter commits
  const filteredCommits = React.useMemo(() => {
    return GROUND_TRUTH_COMMITS.filter((commit) => {
      // 1. Type filter
      if (selectedType !== "all" && commit.eventType !== selectedType) {
        return false
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase().trim()
      const matchHash = commit.commitHash.toLowerCase().includes(query) || commit.fullSha256.toLowerCase().includes(query)
      const matchTitle = commit.title.toLowerCase().includes(query)
      const matchSummary = commit.summary.toLowerCase().includes(query)
      const matchAuthor = commit.author.name.toLowerCase().includes(query) || commit.author.handle.toLowerCase().includes(query)
      const matchLocation = (commit.metadata.location || "").toLowerCase().includes(query)
      const matchTags = commit.tags.some((t) => t.toLowerCase().includes(query))

      return matchHash || matchTitle || matchSummary || matchAuthor || matchLocation || matchTags
    })
  }, [searchQuery, selectedType])

  const handleOpenAudit = (commit: GroundTruthCommit) => {
    setAuditCommit(commit)
    setIsAuditOpen(true)
  }

  const handleCloseAudit = () => {
    setIsAuditOpen(false)
  }

  return (
    <div className="min-h-screen bg-ivory p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Terminal Header */}
      <GroundTruthHeader />

      {/* 2. Audit Search & Color-coded Filters */}
      <AuditSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        counts={counts}
      />

      {/* 3. Sleek Dark-Mode Terminal Vertical Timeline */}
      <div className="rounded-chunky border-2 border-ink bg-[#070A14] p-5 sm:p-8 shadow-hard-md">
        {/* Terminal Header Prompt */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2 text-lime font-bold">
            <Terminal className="w-4 h-4" />
            <span>ledger@movement:~$ git log --graph --oneline --verify</span>
          </div>
          <div className="text-white/50 text-[11px]">
            Showing <strong className="text-white">{filteredCommits.length}</strong> of {GROUND_TRUTH_COMMITS.length} verified commits
          </div>
        </div>

        {/* Commit Cards Vertical Timeline */}
        {filteredCommits.length > 0 ? (
          <div className="space-y-1">
            {filteredCommits.map((commit, index) => (
              <CommitCard
                key={commit.id}
                commit={commit}
                onSelectAudit={handleOpenAudit}
                isLast={index === filteredCommits.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 font-mono">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white/40">
              <FileQuestion className="w-6 h-6" />
            </div>
            <p className="text-sm text-white font-bold">
              No ledger commits matching &quot;{searchQuery}&quot;
            </p>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Check the cryptographic hash or clear your filter query to view all historical commits.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSelectedType("all")
              }}
              className="mt-2 px-3 py-1.5 rounded-sm bg-lime text-ink text-xs font-bold border border-ink hover:bg-lime/90 cursor-pointer"
            >
              Reset Audit Search
            </button>
          </div>
        )}

        {/* Terminal Genesis Footer */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/40">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-lime" />
            <span>Genesis Hash: #c7f91a2 // Root Block 001 Sealed</span>
          </div>
          <span>Cryptographic consensus verified across all field stewards</span>
        </div>
      </div>

      {/* 4. Cryptographic Proof Audit Modal */}
      <CommitAuditModal
        commit={auditCommit}
        open={isAuditOpen}
        onClose={handleCloseAudit}
      />
    </div>
  )
}
