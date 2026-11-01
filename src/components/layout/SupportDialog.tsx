"use client"

import * as React from "react"
import { X, ZoomIn, Download, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { DONATION_CONFIG } from "@/config/donation"

export interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movementName?: string
}

export function SupportDialog({
  open,
  onOpenChange,
}: SupportDialogProps) {
  const [imageError, setImageError] = React.useState(false)
  const [isEnlarged, setIsEnlarged] = React.useState(false)
  const [clipboardFailed, setClipboardFailed] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const triggerElementRef = React.useRef<HTMLElement | null>(null)

  // Save trigger element to return focus on close
  React.useEffect(() => {
    if (open) {
      triggerElementRef.current = document.activeElement as HTMLElement | null
    }
  }, [open])

  // Handle focus return on close
  React.useEffect(() => {
    if (!open && triggerElementRef.current) {
      triggerElementRef.current.focus()
      triggerElementRef.current = null
    }
  }, [open])

  // Reset internal states on open
  React.useEffect(() => {
    if (open) {
      setImageError(false)
      setIsEnlarged(false)
      setClipboardFailed(false)
    }
  }, [open])

  // Close on Escape & trap focus
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isEnlarged) {
          setIsEnlarged(false)
          e.stopPropagation()
          return
        }
        if (open) {
          onOpenChange(false)
          return
        }
      }

      if (e.key === "Tab" && open && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      // Prevent body scroll when dialog or enlarged view is open
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        window.removeEventListener("keydown", handleKeyDown)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open, isEnlarged, onOpenChange])

  // Focus the close button when opened
  React.useEffect(() => {
    if (open && dialogRef.current) {
      const closeBtn = dialogRef.current.querySelector<HTMLElement>('button[aria-label="Close dialog"]')
      closeBtn?.focus()
    }
  }, [open])

  if (!open) return null

  const hasPhone = Boolean(DONATION_CONFIG.phone && DONATION_CONFIG.phone.trim().length > 0)
  const hasEmail = Boolean(DONATION_CONFIG.email && DONATION_CONFIG.email.trim().length > 0)
  const hasPaymentId = Boolean(DONATION_CONFIG.paymentIdOrLink && DONATION_CONFIG.paymentIdOrLink.trim().length > 0)
  const isHttpLink = hasPaymentId && DONATION_CONFIG.paymentIdOrLink.startsWith("http")
  const isUpiLink = hasPaymentId && DONATION_CONFIG.paymentIdOrLink.startsWith("upi://pay")

  const handleCopyPayment = async () => {
    if (!hasPaymentId) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(DONATION_CONFIG.paymentIdOrLink)
        toast("Copied")
      } else {
        setClipboardFailed(true)
      }
    } catch {
      setClipboardFailed(true)
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-dialog-title"
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-ink/70 backdrop-blur-xs overflow-y-auto"
        onClick={() => onOpenChange(false)}
      >
        <div
          ref={dialogRef}
          className="w-full max-w-[480px] rounded-chunky border-2 border-ink bg-white p-4 sm:p-6 shadow-hard-lg space-y-4 my-auto max-h-[92vh] overflow-y-auto focus-visible:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b-2 border-ink">
            <h2 id="support-dialog-title" className="text-xl sm:text-2xl font-black text-ink font-sans tracking-tight">
              Support the <span className="font-serif italic font-normal text-cobalt">movement</span>
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
              className="p-2 rounded-sm border-2 border-ink hover:bg-ivory text-ink min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Contacts at the TOP: Plain Ruled Rows */}
          <div className="border-2 border-ink divide-y-2 divide-ink bg-ivory text-xs">
            <div className="p-3">
              <span className="font-bold text-ink/70 block">Payee</span>
              <span className="font-black text-ink text-sm sm:text-base block">
                {DONATION_CONFIG.payeeName}
              </span>
            </div>

            <div className="p-3">
              <span className="font-bold text-ink/70 block">Purpose</span>
              <p className="text-ink text-xs sm:text-sm font-medium leading-relaxed">
                {DONATION_CONFIG.purpose}
              </p>
            </div>

            {hasPhone && (
              <div className="p-3 flex items-center justify-between">
                <span className="font-bold text-ink/70">Phone</span>
                <a
                  href={`tel:${DONATION_CONFIG.phone}`}
                  className="font-bold text-cobalt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt rounded-xs"
                >
                  {DONATION_CONFIG.phone}
                </a>
              </div>
            )}

            {hasEmail && (
              <div className="p-3 flex items-center justify-between">
                <span className="font-bold text-ink/70">Email</span>
                <a
                  href={`mailto:${DONATION_CONFIG.email}`}
                  className="font-bold text-cobalt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt rounded-xs"
                >
                  {DONATION_CONFIG.email}
                </a>
              </div>
            )}
          </div>

          {/* The QR, BIG */}
          <div className="space-y-3">
            <div className="border-2 border-ink bg-white p-4 sm:p-6 flex flex-col items-center justify-center">
              {imageError ? (
                <div className="p-4 text-center text-xs font-bold text-ink bg-ivory border-2 border-ink w-full">
                  The QR could not be loaded. Use the contact details above.
                </div>
              ) : (
                <div className="w-full flex items-center justify-center bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DONATION_CONFIG.qrImagePath}
                    alt={`QR code to donate to ${DONATION_CONFIG.payeeName}`}
                    onError={() => setImageError(true)}
                    className="w-full max-w-[400px] h-auto object-contain block select-none"
                    style={{
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action buttons under QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsEnlarged(true)}
                className="flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-sm border-2 border-ink bg-ivory hover:bg-white text-ink text-xs font-bold shadow-hard-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              >
                <ZoomIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Tap to enlarge</span>
              </button>

              <a
                href={DONATION_CONFIG.qrImagePath}
                download="donate-qr.png"
                className="flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-sm border-2 border-ink bg-ivory hover:bg-white text-ink text-xs font-bold shadow-hard-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Download QR</span>
              </a>
            </div>

            {/* Optional Payment ID / Link buttons */}
            {hasPaymentId && (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyPayment}
                  className="w-full flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-sm border-2 border-ink bg-lime text-ink text-xs font-bold shadow-hard-xs hover:bg-lime/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                >
                  <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isHttpLink ? "Copy payment link" : "Copy payment ID"}</span>
                </button>

                {clipboardFailed && (
                  <div className="space-y-1 p-2 border-2 border-ink bg-ivory rounded-sm text-xs">
                    <p className="font-bold text-ink">Press and hold to copy</p>
                    <input
                      readOnly
                      value={DONATION_CONFIG.paymentIdOrLink}
                      className="w-full p-2 bg-white border border-ink text-ink text-xs select-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    />
                  </div>
                )}

                {isUpiLink && (
                  <a
                    href={DONATION_CONFIG.paymentIdOrLink}
                    className="w-full flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-sm border-2 border-ink bg-white text-ink text-xs font-bold shadow-hard-xs hover:bg-ivory transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Open in payment app</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Under the QR: Three Plain Lines */}
          <div className="border-t-2 border-ink pt-3 space-y-1.5 text-xs text-ink/80 leading-relaxed">
            <p>Scan with any payment app.</p>
            <p>
              Before you pay, check that the name shown in your payment app is{" "}
              <strong className="text-ink font-bold">{DONATION_CONFIG.payeeName}</strong>.
            </p>
            <p>
              Donations go directly to the person named above. The Movement does not process, hold or track payments.
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-2.5 min-h-[44px] rounded-sm bg-ink text-white font-bold text-xs border-2 border-ink shadow-hard-xs hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full screen "Tap to enlarge" View */}
      {isEnlarged && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged QR code view"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white p-4 sm:p-8"
          onClick={() => setIsEnlarged(false)}
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={() => setIsEnlarged(false)}
              aria-label="Close enlarged view"
              className="p-2 min-h-[44px] min-w-[44px] rounded-sm border-2 border-ink bg-white hover:bg-ivory text-ink flex items-center justify-center shadow-hard-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <div
            className="flex flex-col items-center justify-center max-w-full max-h-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DONATION_CONFIG.qrImagePath}
              alt={`QR code to donate to ${DONATION_CONFIG.payeeName}`}
              className="max-w-[90vw] max-h-[75vh] w-auto h-auto object-contain select-none"
              style={{
                imageRendering: "pixelated",
              }}
            />
            <p className="text-xs font-bold text-ink/70 text-center">
              Scan with any payment app. Tap backdrop or press Esc to return.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
