"use client"

import * as React from "react"
import { GROUND_TRUTH_COMMITS, GroundTruthCommit, GroundTruthEventType } from "@/lib/mocks/ground-truth-data"
import { GroundTruthHeader } from "@/components/ground-truth/GroundTruthHeader"
import { AuditSearchBar } from "@/components/ground-truth/AuditSearchBar"
import { CommitCard } from "@/components/ground-truth/CommitCard"
import { CommitAuditModal } from "@/components/ground-truth/CommitAuditModal"
import { GitCommit, FileQuestion } from "lucide-react"

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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* 1. Header: Ivory, Ruled, Feed-Style */}
      <GroundTruthHeader />

      {/* 2. Audit Search & Color-Coded Filter Chips */}
      <AuditSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        counts={counts}
      />

      {/* 3. Timeline Sequence on Light Canvas */}
      <section aria-labelledby="timeline-heading" className="space-y-4">
        {/* Subhead count */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <h2 id="timeline-heading" className="text-sm font-bold text-ink font-sans">
            Provenance timeline
          </h2>
          <div className="text-xs font-semibold text-ink/60 font-sans tabular-nums">
            Showing <strong className="text-ink">{filteredCommits.length}</strong> of {GROUND_TRUTH_COMMITS.length} verified commits
          </div>
        </div>

        {/* Commit Cards Ruled List */}
        {filteredCommits.length > 0 ? (
          <div className="space-y-1 pt-2">
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
          <div className="py-12 px-6 rounded-sm border-2 border-dashed border-ink/20 text-center space-y-3 bg-white/50">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory border border-ink/20 flex items-center justify-center text-ink/40">
              <FileQuestion className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-ink font-bold font-sans">
              No ledger commits matching &quot;{searchQuery}&quot;
            </p>
            <p className="text-xs text-ink/60 max-w-sm mx-auto font-sans">
              Check the hash or clear your filter query to view all historical commits.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSelectedType("all")
              }}
              className="mt-2 px-3 py-1.5 rounded-sm bg-lime text-ink text-xs font-bold border-2 border-ink hover:bg-lime/90 shadow-hard-xs cursor-pointer font-sans"
            >
              Reset audit search
            </button>
          </div>
        )}

        {/* Genesis Root Footer */}
        <div className="pt-4 border-t border-ink/15 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60 font-sans tabular-nums">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-cobalt" aria-hidden="true" />
            <span>Genesis hash: #c7f91a2 • Root block 001</span>
          </div>
          <span>Consensus verified across community organizers</span>
        </div>
      </section>

      {/* 4. Cryptographic Proof Audit Modal */}
      <CommitAuditModal
        commit={auditCommit}
        open={isAuditOpen}
        onClose={handleCloseAudit}
      />
    </div>
  )
}
