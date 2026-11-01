"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User } from "@/lib/schemas/user.schema"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { UserX } from "lucide-react"

export interface BlockedUsersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockedUserIds: string[]
  usersMap: Record<string, User>
  onUnblock: (userId: string) => void
}

export function BlockedUsersDialog({
  open,
  onOpenChange,
  blockedUserIds,
  usersMap,
  onUnblock,
}: BlockedUsersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-ink rounded-sm p-6 shadow-hard-lg space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-ink shrink-0" />
            <DialogTitle className="text-base font-black text-ink font-sans">
              Blocked people
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink/70">
            Messages and reactions from blocked people are hidden on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-ink/10">
          {blockedUserIds.length === 0 ? (
            <p className="text-xs text-ink/60 py-4 text-center">
              You have not blocked anyone.
            </p>
          ) : (
            blockedUserIds.map((userId) => {
              const u = usersMap[userId]
              const name = u?.display_name || "Volunteer"
              const handle = u?.handle ? `@${u.handle}` : ""

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between py-2.5 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      name={name}
                      avatarUrl={u?.avatar_url}
                      className="h-8 w-8 rounded-sm border border-ink"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-ink truncate">{name}</p>
                      {handle && (
                        <p className="text-[10px] text-ink/60 font-semibold truncate">
                          {handle}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUnblock(userId)}
                    className="text-xs border-2 border-ink h-7 px-2 font-bold hover:bg-ivory"
                  >
                    Unblock
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
