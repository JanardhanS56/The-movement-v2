"use client"

import * as React from "react"
import { GroundTruthCommit } from "@/lib/mocks/ground-truth-data"
import { formatCleanDateTime } from "@/lib/date"
import { X, Check, Copy, ShieldCheck, Terminal, Link as LinkIcon, FileCode, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export interface CommitAuditModalProps {
  commit: GroundTruthCommit | null
  open: boolean
  onClose: () => void
}

export function CommitAuditModal({ commit, open, onClose }: CommitAuditModalProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open || !commit) return null

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedKey(label)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const rawPayload = {
    commit_hash: commit.commitHash,
    full_sha256: commit.fullSha256,
    parent_hash: commit.parentHash,
    block_index: commit.proof.blockNumber,
    timestamp: commit.timestamp,
    event_type: commit.eventType,
    title: commit.title,
    author: {
      name: commit.author.name,
      tier: commit.author.tier,
      role: commit.author.roleTitle,
      user_id: commit.author.id,
    },
    cryptographic_signature: {
      algorithm: commit.proof.algorithm,
      sig_hex: commit.proof.signatureHex,
      pubkey_fingerprint: commit.proof.publicKeyFingerprint,
    },
    metadata: commit.metadata,
  }

  const rawJson = JSON.stringify(rawPayload, null, 2)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-chunky border-2 border-ink bg-[#0C1021] text-[#E0E6F0] shadow-hard-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink/40 bg-[#080B16]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-tomato/80 inline-block border border-ink/40" />
              <span className="w-3 h-3 rounded-full bg-sun/80 inline-block border border-ink/40" />
              <span className="w-3 h-3 rounded-full bg-lime/80 inline-block border border-ink/40" />
            </div>
            <Terminal className="w-4 h-4 text-lime" />
            <span className="font-mono text-xs font-bold text-lime tracking-wide">
              PROVENANCE_AUDITOR // commit {commit.commitHash}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit inspector"
            className="p-1 rounded-sm border border-transparent hover:border-ink/50 hover:bg-white/10 text-[#E0E6F0]/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Badge & Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-black bg-lime text-ink border border-ink font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                CRYPTOGRAPHICALLY VERIFIED
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-white/10 text-white/80 border border-white/20">
                BLOCK #{String(commit.proof.blockNumber).padStart(3, "0")}
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-white/10 text-white/80 border border-white/20">
                {commit.proof.algorithm}
              </span>
            </div>
            <h2 id="audit-modal-title" className="text-xl font-black text-white font-sans tracking-tight">
              {commit.title}
            </h2>
            <p className="text-xs text-white/70">
              {commit.details}
            </p>
          </div>

          {/* Cryptographic Hashes Grid */}
          <div className="rounded-sm border border-white/10 bg-black/40 p-4 space-y-3 font-mono text-xs">
            {/* Commit Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/10">
              <span className="text-white/50 text-[11px] uppercase tracking-wider">Commit Hash:</span>
              <div className="flex items-center gap-2">
                <span className="text-lime font-bold">{commit.commitHash}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(commit.commitHash, "Commit hash")}
                  className="p-1 hover:text-white text-white/60 hover:bg-white/10 rounded cursor-pointer"
                  title="Copy commit hash"
                >
                  {copiedKey === "Commit hash" ? <Check className="w-3 h-3 text-lime" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Parent Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/10">
              <span className="text-white/50 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Parent Link:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white/80">{commit.parentHash}</span>
                {commit.parentHash !== "#0000000" && (
                  <span className="text-[10px] text-lime/90 bg-lime/10 px-1.5 py-0.5 rounded border border-lime/30">
                    CHAIN VALID
                  </span>
                )}
              </div>
            </div>

            {/* Full SHA-256 Fingerprint */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 pb-2 border-b border-white/10">
              <span className="text-white/50 text-[11px] uppercase tracking-wider shrink-0">SHA-256 Digest:</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-white/70 break-all">{commit.fullSha256}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(commit.fullSha256, "Full SHA-256")}
                  className="p-1 hover:text-white text-white/60 hover:bg-white/10 rounded shrink-0 cursor-pointer"
                  title="Copy full SHA-256"
                >
                  {copiedKey === "Full SHA-256" ? <Check className="w-3 h-3 text-lime" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/10">
              <span className="text-white/50 text-[11px] uppercase tracking-wider">Timestamp:</span>
              <span className="text-white/90">{formatCleanDateTime(commit.timestamp)}</span>
            </div>

            {/* Author Key Fingerprint */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-white/50 text-[11px] uppercase tracking-wider">Authorized By:</span>
              <span className="text-white/90">
                {commit.author.name} (Tier {commit.author.tier}) // {commit.proof.publicKeyFingerprint}
              </span>
            </div>
          </div>

          {/* Raw Signed Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 font-mono">
                <FileCode className="w-3.5 h-3.5 text-cobalt" />
                Signed JSON Payload Snapshot
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(rawJson, "Signed payload JSON")}
                className="text-xs font-bold text-lime hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedKey === "Signed payload JSON" ? (
                  <>
                    <Check className="w-3 h-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-sm bg-black/60 border border-white/10 text-[11px] font-mono text-lime/90 overflow-x-auto max-h-48 leading-relaxed">
              {rawJson}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#080B16]">
          <div className="flex items-center gap-1.5 text-xs text-white/60 font-mono">
            <ShieldCheck className="w-4 h-4 text-lime" />
            <span>Immutable Ledger Record</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-lime text-ink font-bold text-xs hover:bg-lime/90 transition-colors border border-ink cursor-pointer font-mono"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
