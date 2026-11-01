"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { REPORT_REASONS, ReportReason } from "@/lib/constants/chat"
import { toast } from "sonner"
import { ShieldAlert } from "lucide-react"

export interface ReportMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: string | null
  onSubmitReport: (messageId: string, reason: ReportReason, note?: string) => Promise<void>
}

export function ReportMessageDialog({
  open,
  onOpenChange,
  messageId,
  onSubmitReport,
}: ReportMessageDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<ReportReason>("harassment")
  const [note, setNote] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageId) return

    setIsSubmitting(true)
    try {
      await onSubmitReport(messageId, selectedReason, note)
      // Rule 8 honest demo toast
      toast.info("Report saved on this device (demo). Organizers do not receive it yet.")
      onOpenChange(false)
      setNote("")
    } catch {
      toast.error("Could not submit report.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-ink rounded-sm p-6 shadow-hard-lg space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-tomato shrink-0" />
            <DialogTitle className="text-lg font-black text-ink font-sans">
              Report message
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink/70">
            Reports help maintain safe, constructive coordination. Choose a reason below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-black text-ink uppercase tracking-wide">
              Reason
            </legend>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2.5 p-2 rounded-sm border-2 cursor-pointer transition-all ${
                    selectedReason === r.value
                      ? "bg-lime/25 border-ink font-bold text-ink"
                      : "bg-ivory border-ink/20 text-ink/80 hover:border-ink/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="accent-ink"
                  />
                  <span className="text-xs">{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="report-note" className="text-xs font-bold text-ink">
              Additional note (optional)
            </label>
            <textarea
              id="report-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide any context that would help review this report..."
              className="w-full p-2.5 rounded-sm border-2 border-ink bg-ivory text-xs text-ink placeholder:text-ink/40 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-ink/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-2 border-ink"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-tomato text-white hover:bg-tomato/90 border-2 border-ink shadow-hard-xs font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
