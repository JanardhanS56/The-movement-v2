"use client"

import * as React from "react"
import { X, Heart, ShieldAlert } from "lucide-react"

export interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movementName?: string
}

/* Decorative SVG QR marked "Demo QR, not scannable" */
function DecorativeDemoQrSvg({ className = "w-48 h-48" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <rect width="200" height="200" fill="var(--ivory)" rx="8" stroke="var(--ink)" strokeWidth="3" />
      
      {/* Top-Left Finder Pattern */}
      <rect x="20" y="20" width="45" height="45" rx="4" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="30" y="30" width="25" height="25" rx="2" fill="var(--ink)" />
      
      {/* Top-Right Finder Pattern */}
      <rect x="135" y="20" width="45" height="45" rx="4" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="145" y="30" width="25" height="25" rx="2" fill="var(--ink)" />
      
      {/* Bottom-Left Finder Pattern */}
      <rect x="20" y="135" width="45" height="45" rx="4" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="30" y="145" width="25" height="25" rx="2" fill="var(--ink)" />
      
      {/* Data Matrix Modules (Abstract Fictional Grid) */}
      <rect x="80" y="24" width="10" height="10" fill="var(--ink)" />
      <rect x="95" y="24" width="10" height="10" fill="var(--cobalt)" />
      <rect x="110" y="24" width="10" height="10" fill="var(--ink)" />
      <rect x="75" y="42" width="12" height="12" fill="var(--ink)" />
      <rect x="95" y="42" width="10" height="10" fill="var(--ink)" />
      <rect x="112" y="42" width="12" height="12" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
      
      <rect x="24" y="80" width="12" height="12" fill="var(--ink)" />
      <rect x="42" y="80" width="10" height="10" fill="var(--cobalt)" />
      <rect x="60" y="80" width="12" height="12" fill="var(--ink)" />
      <rect x="80" y="75" width="40" height="40" rx="6" fill="var(--white)" stroke="var(--ink)" strokeWidth="2.5" />
      {/* Monogram in Center */}
      <path d="M90 105V85l10 12 10-12v20" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      <rect x="130" y="80" width="12" height="12" fill="var(--ink)" />
      <rect x="150" y="80" width="10" height="10" fill="var(--sun)" />
      <rect x="168" y="80" width="10" height="10" fill="var(--ink)" />
      
      <rect x="80" y="130" width="10" height="10" fill="var(--ink)" />
      <rect x="98" y="130" width="12" height="12" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
      <rect x="118" y="130" width="10" height="10" fill="var(--ink)" />
      <rect x="80" y="150" width="12" height="12" fill="var(--cobalt)" />
      <rect x="100" y="150" width="10" height="10" fill="var(--ink)" />
      <rect x="140" y="140" width="10" height="10" fill="var(--ink)" />
      <rect x="160" y="140" width="12" height="12" fill="var(--ink)" />
      <rect x="145" y="160" width="12" height="12" fill="var(--ink)" />
      <rect x="165" y="160" width="10" height="10" fill="var(--sun)" />

      {/* Prominent Overlay Label */}
      <rect x="16" y="88" width="168" height="24" rx="4" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2" />
      <text x="100" y="104" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="var(--ink)" letterSpacing="0.5">
        DEMO QR • NOT SCANNABLE
      </text>
    </svg>
  )
}

export function SupportDialog({
  open,
  onOpenChange,
  movementName = "Coastal Action Front",
}: SupportDialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-chunky border-2 border-ink bg-white p-6 shadow-hard-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b-2 border-ink/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tomato/20 border border-ink flex items-center justify-center text-tomato">
              <Heart className="w-4 h-4 fill-tomato" />
            </div>
            <div>
              <h3 id="support-dialog-title" className="text-base font-black text-ink font-sans">
                Support the movement
              </h3>
              <p className="text-xs text-ink/60">{movementName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close support dialog"
            className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Graphic */}
        <div className="flex flex-col items-center justify-center py-2">
          <DecorativeDemoQrSvg className="w-44 h-44 drop-shadow-xs" />
          <span className="mt-2 text-[11px] font-black uppercase tracking-wider text-ink/70">
            Demo QR, not scannable
          </span>
        </div>

        {/* Payee Details Area */}
        <div className="p-3 rounded-sm bg-ivory border-2 border-ink space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-ink/70">Payee:</span>
            <span className="font-black text-ink">{movementName} Mutual Aid Fund</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-ink/70">Identifier:</span>
            <span className="font-mono text-ink text-[11px]">demo-aid@coastal.front</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-ink/70">Jurisdiction:</span>
            <span className="font-bold text-ink">Coastal Region District</span>
          </div>
        </div>

        {/* Honesty Note (Mandatory Rule 10 & 16) */}
        <div className="flex items-start gap-2 p-2.5 rounded-sm bg-sun/20 border border-ink text-xs text-ink">
          <ShieldAlert className="w-4 h-4 text-ink shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium leading-relaxed">
            Fictional demonstration only. No real payment processing, donations, or transaction totals are handled by this application.
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full py-2 rounded-sm bg-ink text-white font-bold text-xs border-2 border-ink shadow-hard-xs hover:bg-ink/90"
        >
          Close
        </button>
      </div>
    </div>
  )
}
