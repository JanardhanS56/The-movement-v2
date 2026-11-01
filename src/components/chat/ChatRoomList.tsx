"use client"

import * as React from "react"
import { CHAT_ROOMS, ChatRoomDefinition } from "@/lib/constants/chat"
import { Message } from "@/lib/schemas/chat.schema"
import { getUnreadCount, getMentionCount } from "@/lib/mocks/chat-pure"
import { Hash, VolumeX } from "lucide-react"

export interface ChatRoomListProps {
  activeRoomId: string
  onSelectRoom: (roomId: string) => void
  messagesMap: Record<string, Message[]>
  lastReadMap: Record<string, string | null>
  mutedRoomIds?: string[]
  currentUserId?: string | null
  blockedIds?: string[]
}

export function ChatRoomList({
  activeRoomId,
  onSelectRoom,
  messagesMap,
  lastReadMap,
  mutedRoomIds = [],
  currentUserId,
  blockedIds = [],
}: ChatRoomListProps) {
  const mutedSet = new Set(mutedRoomIds)

  return (
    <nav
      aria-label="Chat rooms"
      className="w-full flex flex-col divide-y-2 divide-ink/10 h-full overflow-y-auto"
    >
      <div className="p-4 border-b-2 border-ink bg-ivory">
        <h2 className="text-xs font-black uppercase tracking-wider text-ink/70">
          Chat rooms
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {CHAT_ROOMS.map((room: ChatRoomDefinition) => {
          const isActive = room.id === activeRoomId
          const isMuted = mutedSet.has(room.id)
          const roomMsgs = messagesMap[room.id] || []
          const lastRead = lastReadMap[room.id] || null

          // Derived unread count: hidden if muted or 0
          const rawUnread = getUnreadCount(room.id, lastRead, roomMsgs, blockedIds)
          const unreadCount = isMuted ? 0 : rawUnread

          // Derived mentions of current user in this room
          const mentionCount = currentUserId
            ? getMentionCount(currentUserId, lastRead, roomMsgs, blockedIds)
            : 0

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              aria-current={isActive ? "true" : undefined}
              className={`w-full text-left p-3 rounded-sm border-2 transition-all cursor-pointer flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${
                isActive
                  ? "bg-lime border-ink text-ink font-bold shadow-hard-xs"
                  : "bg-white border-transparent hover:border-ink/20 text-ink/80 hover:text-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Hash className="w-4 h-4 shrink-0 text-ink/70" aria-hidden="true" />
                  <span className="text-sm font-black truncate">{room.name}</span>
                  {isMuted && (
                    <VolumeX
                      className="w-3.5 h-3.5 shrink-0 text-ink/50"
                      aria-label="Room muted"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {mentionCount > 0 && (
                    <span
                      title={`${mentionCount} mentions`}
                      className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-tomato text-white text-[10px] font-black border border-ink tabular-nums"
                    >
                      @{mentionCount}
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <span
                      title={`${unreadCount} unread messages`}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-ink text-ivory text-[10px] font-black tabular-nums"
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-ink/60 truncate font-normal">
                {room.description}
              </p>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
