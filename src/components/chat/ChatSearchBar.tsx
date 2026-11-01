"use client"

import * as React from "react"
import { Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { Message } from "@/lib/schemas/chat.schema"
import { searchMessages } from "@/lib/mocks/chat-pure"

export interface ChatSearchBarProps {
  roomId: string
  messages: Message[]
  blockedIds?: string[]
  onJumpToMessage: (messageId: string) => void
  onClose: () => void
}

export function ChatSearchBar({
  roomId,
  messages,
  blockedIds = [],
  onJumpToMessage,
  onClose,
}: ChatSearchBarProps) {
  const [query, setQuery] = React.useState("")
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const matches = React.useMemo(() => {
    return searchMessages(roomId, query, messages, blockedIds)
  }, [roomId, query, messages, blockedIds])

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Reset index when query changes
  React.useEffect(() => {
    setCurrentIndex(0)
    if (matches.length > 0) {
      onJumpToMessage(matches[0].id)
    }
  }, [matches, onJumpToMessage])

  const handleNext = () => {
    if (matches.length === 0) return
    const next = (currentIndex + 1) % matches.length
    setCurrentIndex(next)
    onJumpToMessage(matches[next].id)
  }

  const handlePrev = () => {
    if (matches.length === 0) return
    const prev = (currentIndex - 1 + matches.length) % matches.length
    setCurrentIndex(prev)
    onJumpToMessage(matches[prev].id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  return (
    <div
      role="search"
      aria-label="Search messages in room"
      className="px-4 py-2 bg-white border-b-2 border-ink flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Search className="w-4 h-4 text-ink/60 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in conversation... (Enter to jump, Esc to close)"
          aria-label="Search messages in room"
          className="flex-1 bg-transparent border-none text-xs text-ink placeholder:text-ink/40 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {query.trim().length > 0 && (
          <span className="text-[11px] tabular-nums font-bold text-ink/70">
            {matches.length === 0
              ? "0 matches"
              : `${currentIndex + 1} of ${matches.length}`}
          </span>
        )}

        {matches.length > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous match"
              className="p-1 rounded-xs hover:bg-ink/5 text-ink/70 hover:text-ink cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next match"
              className="p-1 rounded-xs hover:bg-ink/5 text-ink/70 hover:text-ink cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="p-1 rounded-xs hover:bg-ink/5 text-ink/70 hover:text-ink cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
