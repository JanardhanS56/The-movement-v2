"use client"

import * as React from "react"
import { Pin, X } from "lucide-react"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"

export interface PinnedMessageStripProps {
  pinnedMessage: Message
  author?: User
  onJumpToMessage: (messageId: string) => void
  onUnpin?: (messageId: string) => void
  isOrganizer?: boolean
}

export function PinnedMessageStrip({
  pinnedMessage,
  author,
  onJumpToMessage,
  onUnpin,
  isOrganizer = false,
}: PinnedMessageStripProps) {
  const authorName = author?.display_name || "Volunteer"

  return (
    <div
      role="region"
      aria-label="Pinned message"
      className="px-4 py-2 bg-sun/15 border-b-2 border-ink flex items-center justify-between gap-3 text-xs shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Pin className="w-4 h-4 text-ink shrink-0 fill-sun" aria-hidden="true" />
        <div className="min-w-0 truncate">
          <span className="font-black text-ink">{authorName}: </span>
          <span className="text-ink/80 truncate font-medium">
            {pinnedMessage.text}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onJumpToMessage(pinnedMessage.id)}
          className="text-xs font-black underline hover:text-cobalt cursor-pointer text-ink"
        >
          Jump to message
        </button>

        {isOrganizer && onUnpin && (
          <button
            type="button"
            onClick={() => onUnpin(pinnedMessage.id)}
            aria-label="Unpin message"
            className="p-1 rounded-xs hover:bg-ink/10 text-ink/70 hover:text-ink cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
