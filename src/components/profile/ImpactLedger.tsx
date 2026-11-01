import * as React from "react"
import Link from "next/link"
import { ImpactLedgerEntry } from "@/lib/schemas/impact-ledger.schema"
import { formatDateTime } from "@/lib/date"
import { EmptyState } from "@/components/shared/EmptyState"
import { Scroll, CheckCircle2, UserCheck, ExternalLink, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ImpactLedgerProps {
  entries: ImpactLedgerEntry[]
}

export function ImpactLedger({ entries }: ImpactLedgerProps) {
  return (
    <section aria-labelledby="ledger-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 id="ledger-heading" className="text-lg font-bold tracking-tight text-foreground">
            Impact Ledger
          </h3>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground border border-border">
          {entries.length} {entries.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No Impact Ledger Entries"
          description="No verified task completions recorded yet. Community contributions and peer-reviewed tasks will appear in this ledger."
          icon={<Scroll className="h-6 w-6 text-muted-foreground" aria-hidden="true" />}
          action={
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="gap-2 border-border min-h-[44px]">
                <span>Browse Available Tasks</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
          {entries.map((entry) => {
            const isPeerVote = entry.verification_method === "peer_vote"

            return (
              <div
                key={entry.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors border-l-4 border-l-primary"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Task Name linking to /tasks */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/tasks"
                      className="font-semibold text-base text-foreground hover:text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{entry.task_title}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </div>

                  {/* Verification detail, method, and date */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {isPeerVote ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-verified" aria-hidden="true" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 text-caution" aria-hidden="true" />
                      )}
                      <span>{entry.verified_by_detail}</span>
                    </span>

                    <span className="text-muted-foreground">•</span>

                    <span className="font-mono text-[11px]">
                      {entry.verification_method === "peer_vote"
                        ? "Peer Consensus"
                        : "Organizer Override"}
                    </span>

                    <span className="text-muted-foreground">•</span>

                    <span className="font-mono text-[11px]">
                      {formatDateTime(entry.verified_at)}
                    </span>
                  </div>
                </div>

                {/* Points badge */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-primary/10 border border-primary/30 text-primary-light font-mono font-bold text-xs tracking-tight">
                    +{entry.reward_points} pts
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
