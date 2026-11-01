"use client"

import * as React from "react"
import { Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { User } from "@/lib/schemas/user.schema"

export interface ChatComposerProps {
  onSendMessage: (text: string) => Promise<void>
  isSending?: boolean
  replyingToMessage?: {
    id: string
    authorName: string
    preview: string
  } | null
  onCancelReply?: () => void
  users?: User[]
  disabled?: boolean
}

export function ChatComposer({
  onSendMessage,
  isSending = false,
  replyingToMessage,
  onCancelReply,
  users = [],
  disabled = false,
}: ChatComposerProps) {
  const [text, setText] = React.useState("")
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null)
  const [selectedMentionIndex, setSelectedMentionIndex] = React.useState(0)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const charCount = text.length
  const isOverLimit = charCount > 500
  const isEmpty = text.trim().length === 0
  const canSend = !isEmpty && !isOverLimit && !isSending && !disabled

  // Filter mention suggestions when typing @
  const mentionSuggestions = React.useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return users
      .filter((u) => u.handle && u.handle.toLowerCase().includes(q))
      .slice(0, 5)
  }, [mentionQuery, users])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)

    // Check if cursor is right after an '@'
    const cursor = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursor)
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/)

    if (atMatch) {
      setMentionQuery(atMatch[1])
      setSelectedMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  const insertMention = (handle: string) => {
    if (!textareaRef.current) return
    const cursor = textareaRef.current.selectionStart
    const textBeforeCursor = text.slice(0, cursor)
    const textAfterCursor = text.slice(cursor)

    const atIndex = textBeforeCursor.lastIndexOf("@")
    if (atIndex >= 0) {
      const newText =
        textBeforeCursor.slice(0, atIndex) + `@${handle} ` + textAfterCursor
      setText(newText)
      setMentionQuery(null)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canSend) return

    const toSend = text
    setText("")
    setMentionQuery(null)

    try {
      await onSendMessage(toSend)
    } catch {
      // If send failed, restore text so user doesn't lose it
      setText(toSend)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention suggestions dropdown keyboard navigation
    if (mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev + 1) % mentionSuggestions.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedMentionIndex(
          (prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length
        )
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const selected = mentionSuggestions[selectedMentionIndex]
        if (selected?.handle) {
          insertMention(selected.handle)
        }
        return
      }
      if (e.key === "Escape") {
        setMentionQuery(null)
        return
      }
    }

    // Enter without shift sends
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t-2 border-ink bg-white p-3 sm:p-4 space-y-2 relative">
      {/* Mention autocomplete dropdown */}
      {mentionSuggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Member mentions"
          className="absolute bottom-full left-4 mb-2 w-64 bg-white border-2 border-ink rounded-sm shadow-hard-md overflow-hidden z-20"
        >
          <div className="px-3 py-1.5 bg-ivory border-b border-ink/20 text-[10px] font-black uppercase text-ink/60">
            Mention member
          </div>
          {mentionSuggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              role="option"
              aria-selected={idx === selectedMentionIndex}
              onClick={() => user.handle && insertMention(user.handle)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                idx === selectedMentionIndex
                  ? "bg-lime text-ink font-bold"
                  : "hover:bg-ivory text-ink/80"
              }`}
            >
              <span className="font-bold">{user.display_name}</span>
              <span className="text-[11px] text-ink/50">@{user.handle}</span>
            </button>
          ))}
        </div>
      )}

      {/* Replying banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-sm bg-sun/20 border border-ink text-xs text-ink font-medium">
          <div className="truncate">
            <span className="font-bold">Replying to {replyingToMessage.authorName}: </span>
            <span className="text-ink/70 italic">&ldquo;{replyingToMessage.preview}&rdquo;</span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              className="p-1 text-ink/60 hover:text-ink cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="chat-message-input" className="sr-only">
          Write a message
        </label>

        <div className="relative">
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            rows={2}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
            aria-label="Write a message"
            disabled={disabled || isSending}
            className={`w-full p-2.5 rounded-sm border-2 text-xs sm:text-sm text-ink placeholder:text-ink/40 resize-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${
              isOverLimit ? "border-tomato bg-tomato/5" : "border-ink bg-ivory/50"
            }`}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Character counter */}
          <span
            className={`text-[11px] tabular-nums font-bold ${
              isOverLimit
                ? "text-tomato font-black"
                : charCount > 450
                ? "text-sun font-black"
                : "text-ink/50"
            }`}
          >
            {charCount}/500
          </span>

          <Button
            type="submit"
            size="sm"
            disabled={!canSend}
            className="gap-2 bg-ink text-white hover:bg-ink/90 font-bold border-2 border-ink shadow-hard-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Send</span>
          </Button>
        </div>

        {/* Rule 8 Privacy disclaimer line */}
        <p className="text-[11px] text-ink/60 font-medium leading-tight">
          Messages are visible to everyone in this chat. Do not share your address, phone number or anything private.
        </p>
      </form>
    </div>
  )
}
