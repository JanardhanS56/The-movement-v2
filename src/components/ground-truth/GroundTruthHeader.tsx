"use client"

import * as React from "react"
import { Shield, GitCommit, GitBranch, Cpu, Clock } from "lucide-react"

export function GroundTruthHeader() {
  return (
    <div className="rounded-chunky border-2 border-ink bg-[#070A14] text-white p-6 shadow-hard-md relative overflow-hidden space-y-4">
      {/* Background terminal grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Terminal Title Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-sm bg-lime text-ink border border-ink">
              <GitCommit className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="font-mono text-xs font-bold text-lime uppercase tracking-widest">
              Civic Provenance Engine // v1.0
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            Ground truth
          </h1>
          <p className="text-xs sm:text-sm text-white/70 font-sans max-w-2xl leading-relaxed">
            Git for Civic Action. An immutable, timestamped ledger of every announcement, verified task, and crowd alert. When media spins the narrative, the provenance ledger stands as the unalterable record of what happened.
          </p>
        </div>

        {/* Live Terminal Telemetry Badges */}
        <div className="flex flex-col sm:items-end gap-1.5 font-mono text-xs shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0D1224] border border-lime/30 text-lime font-bold">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            <span>LEDGER STATUS: IMMUTABLE</span>
          </div>
          <span className="text-[11px] text-white/50">
            Chain Head: <strong className="text-white">#d1928ec</strong> | Genesis: <strong className="text-white">#c7f91a2</strong>
          </span>
        </div>
      </div>

      {/* Telemetry Stats Ribbon */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
        <div className="p-2.5 rounded-sm bg-[#0B0F20] border border-white/10 space-y-0.5">
          <div className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-cobalt" /> Consensus Branch
          </div>
          <div className="text-white font-bold">refs/heads/consensus</div>
        </div>

        <div className="p-2.5 rounded-sm bg-[#0B0F20] border border-white/10 space-y-0.5">
          <div className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-lime" /> Cryptography
          </div>
          <div className="text-white font-bold">Ed25519 + SHA-256</div>
        </div>

        <div className="p-2.5 rounded-sm bg-[#0B0F20] border border-white/10 space-y-0.5">
          <div className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-sun" /> Trust Verification
          </div>
          <div className="text-white font-bold">Tier 3 Multi-Sig</div>
        </div>

        <div className="p-2.5 rounded-sm bg-[#0B0F20] border border-white/10 space-y-0.5">
          <div className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FF6B6B]" /> Timestamp Resolution
          </div>
          <div className="text-white font-bold">UTC Minute Precision</div>
        </div>
      </div>
    </div>
  )
}
