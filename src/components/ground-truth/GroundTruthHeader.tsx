"use client"

import * as React from "react"
import { Shield, GitBranch, Cpu, Clock, CheckCircle2 } from "lucide-react"

export function GroundTruthHeader() {
  return (
    <header className="space-y-6 border-b border-ink/15 pb-6">
      {/* 1. Header Row: Title, Subtitle, and Ledger Status Chip */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
              Ground truth
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime text-ink border border-ink shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Ledger active</span>
            </span>
          </div>
          <p className="text-sm text-ink/70 font-sans max-w-2xl leading-relaxed">
            Git for civic action. An immutable, timestamped record of every announcement, verified task, and crowd alert. When media spins the narrative, the provenance ledger stands as the unalterable record of what happened.
          </p>
          <div className="text-xs text-ink/60 font-sans tabular-nums pt-0.5">
            Chain head: <span className="font-bold text-ink">#d1928ec</span> • Genesis: <span className="font-bold text-ink">#c7f91a2</span>
          </div>
        </div>
      </div>

      {/* 2. Four Info Pairs (Plain Row with Thin Vertical Rules, No Boxes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-ink/15 border-y border-ink/15 py-3">
        <div className="py-2 md:py-0 md:pr-4 flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs text-ink/60 font-medium">Consensus branch</div>
            <div className="text-sm font-bold text-ink font-sans">Main timeline</div>
          </div>
        </div>

        <div className="py-2 md:py-0 md:px-4 flex items-center gap-3">
          <Cpu className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs text-ink/60 font-medium">Cryptography</div>
            <div className="text-sm font-bold text-ink font-sans">Ed25519 + SHA-256</div>
          </div>
        </div>

        <div className="py-2 md:py-0 md:px-4 flex items-center gap-3">
          <Shield className="w-4 h-4 text-sun shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs text-ink/60 font-medium">Trust verification</div>
            <div className="text-sm font-bold text-ink font-sans">Tier 3 multi-sig</div>
          </div>
        </div>

        <div className="py-2 md:py-0 md:pl-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-tomato shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs text-ink/60 font-medium">Timestamp resolution</div>
            <div className="text-sm font-bold text-ink font-sans">UTC minute precision</div>
          </div>
        </div>
      </div>
    </header>
  )
}
