import * as React from "react"
import { CheckCircle2, FileSignature } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SignatureChipProps {
  signedCount: number
  requiredCount: number
  isVerified?: boolean
  className?: string
}

export function SignatureChip({
  signedCount,
  requiredCount,
  isVerified = false,
  className,
}: SignatureChipProps) {
  const verified = isVerified || signedCount >= requiredCount

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Monospace X / Y Signed Stamp */}
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-medium border",
          verified
            ? "bg-primary/10 text-primary border-primary/25"
            : "bg-amber-500/10 text-amber-400 border-amber-500/25"
        )}
        aria-label={`${signedCount} of ${requiredCount} signatures recorded`}
      >
        <FileSignature className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {signedCount} / {requiredCount} Signed
        </span>
      </span>

      {/* Verified Label (Text + Icon) */}
      {verified && (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          role="status"
          aria-label="Verified announcement"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold tracking-wide uppercase text-[11px]">Verified</span>
        </span>
      )}
    </div>
  )
}
