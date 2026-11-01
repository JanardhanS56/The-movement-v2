"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

export interface SignConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
  announcementTitle: string
}

export function SignConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  announcementTitle,
}: SignConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Co-Signature</AlertDialogTitle>
          <AlertDialogDescription>
            You are co-signing &ldquo;{announcementTitle}&rdquo; as an Organizer.
            Your cryptographic signature will be permanently added to the verification ledger.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2">
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            loading={isPending}
            disabled={isPending}
            variant="default"
          >
            Sign Announcement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
