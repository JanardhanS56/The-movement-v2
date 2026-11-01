import * as React from "react"
import { Check, FileSignature } from "lucide-react"
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
      {/* Progress Stamp */}
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs tabular-nums font-bold border-2 border-ink shadow-hard-xs",
          verified
            ? "bg-cobalt text-white"
            : "bg-sun text-ink"
        )}
        aria-label={`${signedCount} of ${requiredCount} signatures recorded`}
      >
        <FileSignature className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {signedCount} of {requiredCount} signed
        </span>
      </span>

      {/* Verified Stamp */}
      {verified && (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold bg-lime text-ink border-2 border-ink shadow-hard-xs"
          role="status"
          aria-label="Verified announcement"
        >
          <Check className="w-3.5 h-3.5 shrink-0 text-ink" aria-hidden="true" />
          <span>Verified</span>
        </span>
      )}
    </div>
  )
}
