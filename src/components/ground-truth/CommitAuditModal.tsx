"use client"

import * as React from "react"
import { GroundTruthCommit } from "@/lib/mocks/ground-truth-data"
import { formatCleanDateTime } from "@/lib/date"
import { X, Check, Copy, ShieldCheck, Link as LinkIcon, FileCode, CheckCircle2 } from "lucide-react"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-chunky border-2 border-ink bg-white text-ink shadow-hard-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink bg-ivory">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cobalt" aria-hidden="true" />
            <span className="font-bold text-sm text-ink font-sans">
              Audit inspector: {commit.commitHash}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit inspector"
            className="p-1 rounded-sm border-2 border-transparent hover:border-ink hover:bg-white text-ink/70 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Badge & Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime text-ink border border-ink">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                <span>Cryptographically verified</span>
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-sans tabular-nums bg-ivory text-ink/80 border border-ink/20">
                Block #{String(commit.proof.blockNumber).padStart(3, "0")}
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-sans bg-ivory text-ink/80 border border-ink/20">
                {commit.proof.algorithm}
              </span>
            </div>
            <h2 id="audit-modal-title" className="text-xl font-black text-ink font-sans tracking-tight">
              {commit.title}
            </h2>
            <p className="text-sm text-ink/80 leading-relaxed font-sans">
              {commit.details}
            </p>
          </div>

          {/* Cryptographic Hashes Grid */}
          <div className="rounded-sm border-2 border-ink/20 bg-ivory/60 p-4 space-y-3 font-sans text-xs">
            {/* Commit Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-ink/10">
              <span className="text-ink/60 font-medium">Commit hash:</span>
              <div className="flex items-center gap-2">
                <span className="text-ink font-bold tabular-nums">{commit.commitHash}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(commit.commitHash, "Commit hash")}
                  className="p-1 hover:bg-white rounded border border-ink/20 text-ink/70 hover:text-ink cursor-pointer"
                  title="Copy commit hash"
                >
                  {copiedKey === "Commit hash" ? <Check className="w-3 h-3 text-cobalt" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Parent Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-ink/10">
              <span className="text-ink/60 font-medium flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Parent link:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-ink/80 tabular-nums">{commit.parentHash}</span>
                {commit.parentHash !== "#0000000" && (
                  <span className="text-[10px] text-ink font-bold bg-lime/30 px-1.5 py-0.5 rounded border border-ink/20">
                    Chain valid
                  </span>
                )}
              </div>
            </div>

            {/* Full SHA-256 Fingerprint */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 pb-2 border-b border-ink/10">
              <span className="text-ink/60 font-medium shrink-0">SHA-256 digest:</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-ink/80 break-all tabular-nums font-sans">{commit.fullSha256}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(commit.fullSha256, "Full SHA-256")}
                  className="p-1 hover:bg-white rounded border border-ink/20 text-ink/70 hover:text-ink shrink-0 cursor-pointer"
                  title="Copy full SHA-256"
                >
                  {copiedKey === "Full SHA-256" ? <Check className="w-3 h-3 text-cobalt" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-ink/10">
              <span className="text-ink/60 font-medium">Timestamp:</span>
              <span className="text-ink font-semibold tabular-nums">{formatCleanDateTime(commit.timestamp)}</span>
            </div>

            {/* Author Key Fingerprint */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-ink/60 font-medium">Authorized by:</span>
              <span className="text-ink font-semibold tabular-nums">
                {commit.author.name} (Tier {commit.author.tier}) • {commit.proof.publicKeyFingerprint}
              </span>
            </div>
          </div>

          {/* Raw Signed Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink/70 flex items-center gap-1.5 font-sans">
                <FileCode className="w-3.5 h-3.5 text-cobalt" aria-hidden="true" />
                <span>Signed JSON payload snapshot</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(rawJson, "Signed payload JSON")}
                className="text-xs font-bold text-cobalt hover:underline flex items-center gap-1 cursor-pointer font-sans"
              >
                {copiedKey === "Signed payload JSON" ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-sm bg-ivory border-2 border-ink/15 text-xs text-ink/90 overflow-x-auto max-h-48 leading-relaxed font-sans tabular-nums whitespace-pre">
              {rawJson}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-ink bg-ivory">
          <div className="flex items-center gap-1.5 text-xs text-ink/60 font-sans">
            <ShieldCheck className="w-4 h-4 text-cobalt" aria-hidden="true" />
            <span>Immutable ledger record</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-lime text-ink font-bold text-xs hover:bg-lime/90 transition-colors border-2 border-ink shadow-hard-xs cursor-pointer font-sans"
          >
            Close inspector
          </button>
        </div>
      </div>
    </div>
  )
}
