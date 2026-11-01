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
import { ShieldCheck } from "lucide-react"

export interface ChatRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAcknowledge?: () => void
}

export function ChatRulesDialog({
  open,
  onOpenChange,
  onAcknowledge,
}: ChatRulesDialogProps) {
  const handleAcknowledge = () => {
    try {
      sessionStorage.setItem("the-movement:chat:rules-acknowledged", "true")
    } catch {}
    onAcknowledge?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-ink rounded-sm p-6 shadow-hard-lg space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cobalt shrink-0" />
            <DialogTitle className="text-lg font-black text-ink font-sans">
              Chat rules
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink/70">
            Please read these community standards before participating in movement discussions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs text-ink/80 leading-relaxed max-h-72 overflow-y-auto">
          <div className="p-2.5 rounded-sm bg-ivory border border-ink/20 space-y-1">
            <p className="font-black text-ink">1. Be respectful</p>
            <p className="text-[11px] text-ink/70">
              Treat all volunteers and coordinators with dignity. Constructive disagreements are welcome; insults and aggression are not.
            </p>
          </div>

          <div className="p-2.5 rounded-sm bg-ivory border border-ink/20 space-y-1">
            <p className="font-black text-ink">2. No harassment or hate speech</p>
            <p className="text-[11px] text-ink/70">
              Harassment, discrimination, threatening speech, or targeted attacks will result in message removal and blocking.
            </p>
          </div>

          <div className="p-2.5 rounded-sm bg-ivory border border-ink/20 space-y-1">
            <p className="font-black text-ink">3. Protect private information</p>
            <p className="text-[11px] text-ink/70">
              Never share phone numbers, home addresses, bank accounts, or personal contact details. Messages are visible to all members.
            </p>
          </div>

          <div className="p-2.5 rounded-sm bg-ivory border border-ink/20 space-y-1">
            <p className="font-black text-ink">4. No illegal or dangerous content</p>
            <p className="text-[11px] text-ink/70">
              Do not coordinate illegal activities or share dangerous instructions.
            </p>
          </div>

          <div className="p-2.5 rounded-sm bg-ivory border border-ink/20 space-y-1">
            <p className="font-black text-ink">5. Organizer moderation</p>
            <p className="text-[11px] text-ink/70">
              Tier 3 organizers have discretion to remove messages or enable slow mode. This demo does not promise instant automated moderation.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-ink/10">
          <Button
            type="button"
            onClick={handleAcknowledge}
            className="w-full bg-ink text-white hover:bg-ink/90 border-2 border-ink shadow-hard-xs font-bold"
          >
            I understand and agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
