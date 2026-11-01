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
import { AlertTriangle, Trash2 } from "lucide-react"

export interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isOrganizerRemoval?: boolean
  onConfirm: () => Promise<void>
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  isOrganizerRemoval = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-2 border-ink rounded-sm p-6 shadow-hard-lg space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {isOrganizerRemoval ? (
              <AlertTriangle className="w-5 h-5 text-tomato shrink-0" />
            ) : (
              <Trash2 className="w-5 h-5 text-tomato shrink-0" />
            )}
            <DialogTitle className="text-base font-black text-ink font-sans">
              {isOrganizerRemoval ? "Remove message as organizer" : "Delete message"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink/70">
            {isOrganizerRemoval
              ? "Are you sure you want to remove this message? Its text will be replaced with 'Message removed by an organizer' and its reactions will be cleared."
              : "Are you sure you want to delete this message? This cannot be undone."}
          </DialogDescription>
        </DialogHeader>

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
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-tomato text-white hover:bg-tomato/90 border-2 border-ink shadow-hard-xs font-bold"
          >
            {isDeleting
              ? "Removing..."
              : isOrganizerRemoval
              ? "Remove message"
              : "Delete message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
