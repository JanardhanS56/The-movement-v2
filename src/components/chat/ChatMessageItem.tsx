"use client"

import * as React from "react"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { formatShortTime } from "@/lib/date"
import { AlertCircle, Check, Loader2 } from "lucide-react"

export interface ChatMessageItemProps {
  message: Message
  author?: User
  isOwn: boolean
  isGrouped: boolean
  dayDivider?: string | null
  onRetry?: (message: Message) => void
  onSelectTask?: (taskId: string) => void
}

/**
 * Parses plain message text into nodes with bold @mentions and safe plain text links.
 */
function renderMessageText(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g)

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <strong key={index} className="font-black text-ink underline decoration-ink/30 underline-offset-2">
          {part}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function ChatMessageItem({
  message,
  author,
  isOwn,
  isGrouped,
  dayDivider,
  onRetry,
  onSelectTask,
}: ChatMessageItemProps) {
  const authorName = author?.display_name || "Volunteer"
  const isRemoved = message.status === "removed"

  return (
    <div className="w-full space-y-2">
      {/* 1. Day Divider (if new calendar day) */}
      {dayDivider && (
        <div className="flex items-center justify-center my-4" aria-hidden="true">
          <div className="h-px bg-ink/20 flex-1" />
          <span className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-ink/60 bg-ivory border border-ink/20 rounded-full">
            {dayDivider}
          </span>
          <div className="h-px bg-ink/20 flex-1" />
        </div>
      )}

      {/* 2. Message Row */}
      <div
        className={`flex gap-3 px-3 sm:px-4 py-1 items-start ${
          isOwn ? "justify-end" : "justify-start"
        }`}
      >
        {/* Left Avatar for others (hidden when grouped) */}
        {!isOwn && (
          <div className="w-8 shrink-0">
            {!isGrouped ? (
              <UserAvatar
                name={authorName}
                avatarUrl={author?.avatar_url}
                className="h-8 w-8 border-2 border-ink rounded-sm"
              />
            ) : (
              <div className="w-8" aria-hidden="true" />
            )}
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
            isOwn ? "items-end text-right" : "items-start text-left"
          }`}
        >
          {/* Header metadata (author, tier, time, you label) */}
          {!isGrouped && (
            <div
              className={`flex items-center gap-2 mb-1 text-xs ${
                isOwn ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <span className="font-black text-ink">{authorName}</span>

              {isOwn && (
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-xs bg-ink text-ivory border border-ink">
                  You
                </span>
              )}

              {author && <TierBadge tier={author.tier} showIcon={false} />}

              <time
                dateTime={message.createdAt}
                className="text-[11px] text-ink/50 tabular-nums font-semibold"
              >
                {formatShortTime(message.createdAt)}
              </time>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`p-3 rounded-sm text-xs sm:text-sm leading-relaxed border-2 ${
              isRemoved
                ? "bg-ink/5 border-dashed border-ink/30 text-ink/60 italic"
                : isOwn
                ? "bg-lime border-ink text-ink font-medium shadow-hard-xs"
                : "bg-white border-ink text-ink font-medium shadow-hard-xs"
            }`}
          >
            {isRemoved ? (
              <p>Message removed by an organizer</p>
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {renderMessageText(message.text)}
              </p>
            )}

            {/* Attached Task Reference if present */}
            {message.taskRef && !isRemoved && (
              <div className="mt-2 pt-2 border-t border-ink/20 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-ink/70">
                  Referenced task
                </span>
                {onSelectTask ? (
                  <button
                    type="button"
                    onClick={() => onSelectTask(message.taskRef!)}
                    className="text-[11px] font-black underline hover:text-cobalt cursor-pointer"
                  >
                    View task
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-ink/60">
                    Task #{message.taskRef.slice(0, 8)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status indicators */}
          {isOwn && !isRemoved && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-ink/60 font-semibold tabular-nums">
              {message.status === "sending" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-ink/60" />
                  <span>Sending</span>
                </>
              )}
              {message.status === "sent" && (
                <>
                  <Check className="w-3 h-3 text-ink/70" />
                  <span>Sent</span>
                </>
              )}
              {message.status === "failed" && (
                <button
                  type="button"
                  onClick={() => onRetry?.(message)}
                  className="flex items-center gap-1 text-tomato font-bold underline cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Failed, tap to retry</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Avatar for own messages (hidden when grouped) */}
        {isOwn && (
          <div className="w-8 shrink-0">
            {!isGrouped ? (
              <UserAvatar
                name={authorName}
                avatarUrl={author?.avatar_url}
                className="h-8 w-8 border-2 border-ink rounded-sm"
              />
            ) : (
              <div className="w-8" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
