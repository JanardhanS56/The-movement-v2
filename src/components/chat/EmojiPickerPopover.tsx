"use client"

import * as React from "react"
import { CHAT_REACTIONS, ALLOWED_REACTION_KEYS, ReactionKey } from "@/lib/constants/chat"

export interface EmojiPickerPopoverProps {
  open: boolean
  onClose: () => void
  onSelectReaction: (key: ReactionKey) => void
  anchorRef?: React.RefObject<HTMLElement>
}

export function EmojiPickerPopover({
  open,
  onClose,
  onSelectReaction,
}: EmojiPickerPopoverProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonsRef = React.useRef<(HTMLButtonElement | null)[]>([])
  const focusedIndexRef = React.useRef(0)

  // Focus trap / Arrow navigation inside picker
  React.useEffect(() => {
    if (open) {
      focusedIndexRef.current = 0
      setTimeout(() => {
        buttonsRef.current[0]?.focus()
      }, 50)
    }
  }, [open])

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        const next = (focusedIndexRef.current + 1) % ALLOWED_REACTION_KEYS.length
        focusedIndexRef.current = next
        buttonsRef.current[next]?.focus()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        const next =
          (focusedIndexRef.current - 1 + ALLOWED_REACTION_KEYS.length) %
          ALLOWED_REACTION_KEYS.length
        focusedIndexRef.current = next
        buttonsRef.current[next]?.focus()
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Reaction options"
      className="absolute bottom-full mb-2 z-30 flex items-center gap-1 p-1.5 bg-white border-2 border-ink rounded-sm shadow-hard-md animate-in fade-in zoom-in-95 duration-100"
    >
      {ALLOWED_REACTION_KEYS.map((key, index) => {
        const meta = CHAT_REACTIONS[key]
        return (
          <button
            key={key}
            ref={(el) => {
              buttonsRef.current[index] = el
            }}
            type="button"
            onClick={() => {
              onSelectReaction(key)
              onClose()
            }}
            aria-label={meta.label}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xl rounded-sm hover:bg-ivory active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt cursor-pointer"
          >
            <span aria-hidden="true">{meta.glyph}</span>
          </button>
        )
      })}
    </div>
  )
}
