"use client"

import * as React from "react"
import { ChatRoomDefinition } from "@/lib/constants/chat"
import { User } from "@/lib/schemas/user.schema"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { Button } from "@/components/ui/button"
import { X, VolumeX, Volume2, CheckCheck, Shield, UserX, Info } from "lucide-react"

export interface RoomInfoDrawerProps {
  open: boolean
  onClose: () => void
  room: ChatRoomDefinition
  organizers: User[]
  isMuted: boolean
  blockedCount: number
  onToggleMute: () => void
  onMarkAllAsRead: () => void
  onOpenRules: () => void
  onOpenBlocked: () => void
}

export function RoomInfoDrawer({
  open,
  onClose,
  room,
  organizers,
  isMuted,
  blockedCount,
  onToggleMute,
  onMarkAllAsRead,
  onOpenRules,
  onOpenBlocked,
}: RoomInfoDrawerProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${room.name} details and tools`}
      className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 bg-white border-l-2 border-ink h-full p-5 shadow-hard-lg flex flex-col justify-between overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-cobalt" />
              <h2 className="text-base font-black text-ink font-sans">
                Room details
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close room details"
              className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Room Summary */}
          <div className="p-3 rounded-sm bg-ivory border-2 border-ink space-y-1">
            <h3 className="text-sm font-black text-ink">{room.name}</h3>
            <p className="text-xs text-ink/70 leading-relaxed">
              {room.description}
            </p>
          </div>

          {/* Room Controls (Mute & Mark Read) */}
          <div className="space-y-2 pt-2 border-t border-ink/10">
            <div className="flex items-center justify-between p-3 rounded-sm bg-ivory border border-ink/20">
              <div className="flex items-center gap-2">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-ink/60" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cobalt" />
                )}
                <div>
                  <p className="text-xs font-black text-ink">Mute notifications</p>
                  <p className="text-[10px] text-ink/60">
                    Silences unread count for this room
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={isMuted}
                className={`w-11 h-6 rounded-full border-2 border-ink transition-colors relative cursor-pointer ${
                  isMuted ? "bg-tomato" : "bg-ink/10"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white border border-ink transition-transform ${
                    isMuted ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onMarkAllAsRead()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 border-2 border-ink bg-white hover:bg-ivory text-xs font-bold"
            >
              <CheckCheck className="w-3.5 h-3.5 text-ink/70" />
              <span>Mark all as read</span>
            </Button>
          </div>

          {/* Organizers in this room */}
          <div className="space-y-2 pt-2 border-t border-ink/10">
            <p className="text-[10px] uppercase font-black tracking-wider text-ink/60">
              Room organizers
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {organizers.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-2 rounded-xs bg-ivory/50 border border-ink/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar
                      name={org.display_name}
                      avatarUrl={org.avatar_url}
                      className="h-7 w-7 rounded-sm border border-ink"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-ink truncate">
                        {org.display_name}
                      </p>
                      <p className="text-[10px] text-ink/50 truncate">
                        @{org.handle}
                      </p>
                    </div>
                  </div>
                  <TierBadge tier={org.tier} showIcon={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick links to Rules and Blocked */}
          <div className="space-y-1.5 pt-2 border-t border-ink/10">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenRules()
              }}
              className="w-full text-left p-2.5 rounded-sm bg-ivory border border-ink/20 hover:border-ink flex items-center justify-between text-xs font-bold text-ink cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cobalt" />
                <span>Community rules</span>
              </div>
              <span className="text-[10px] text-ink/50">View</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenBlocked()
              }}
              className="w-full text-left p-2.5 rounded-sm bg-ivory border border-ink/20 hover:border-ink flex items-center justify-between text-xs font-bold text-ink cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-ink/70" />
                <span>Blocked people</span>
              </div>
              <span className="text-[10px] font-bold text-ink/60 tabular-nums">
                {blockedCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
