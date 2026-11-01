"use client"

import * as React from "react"
import {
  MoreVertical,
  Reply,
  Pin,
  PinOff,
  Trash2,
  ShieldAlert,
  UserX,
  SmilePlus,
} from "lucide-react"
import { Message } from "@/lib/schemas/chat.schema"
import { ReactionKey } from "@/lib/constants/chat"
import { EmojiPickerPopover } from "./EmojiPickerPopover"

export interface MessageActionsMenuProps {
  message: Message
  isOwn: boolean
  isOrganizer: boolean
  isPinned: boolean
  onReply: (message: Message) => void
  onToggleReaction: (key: ReactionKey) => void
  onTogglePin: (messageId: string) => void
  onDelete: (messageId: string) => void
  onRemoveByOrganizer: (messageId: string) => void
  onReport: (messageId: string) => void
  onBlockUser: (authorId: string) => void
}

export function MessageActionsMenu({
  message,
  isOwn,
  isOrganizer,
  isPinned,
  onReply,
  onToggleReaction,
  onTogglePin,
  onDelete,
  onRemoveByOrganizer,
  onReport,
  onBlockUser,
}: MessageActionsMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click or Esc
  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  if (message.status === "removed") return null

  return (
    <div ref={menuRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Message options"
        aria-expanded={open}
        className="p-1 rounded-sm text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {/* Popover Menu */}
      {open && (
        <div
          role="menu"
          aria-label="Message actions"
          className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-ink rounded-sm shadow-hard-md z-40 py-1 text-xs divide-y divide-ink/10"
        >
          <div className="py-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onReply(message)
              }}
              className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 font-bold text-ink cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5 text-ink/70" />
              <span>Reply</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setPickerOpen(true)
              }}
              className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 font-bold text-ink cursor-pointer"
            >
              <SmilePlus className="w-3.5 h-3.5 text-ink/70" />
              <span>Add reaction</span>
            </button>
          </div>

          {/* Organizer Pin Option */}
          {isOrganizer && (
            <div className="py-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onTogglePin(message.id)
                }}
                className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 font-bold text-ink cursor-pointer"
              >
                {isPinned ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-ink/70" />
                    <span>Unpin message</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-ink/70" />
                    <span>Pin message</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Moderation / Safety Options */}
          <div className="py-0.5">
            {!isOwn && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onReport(message.id)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-tomato/10 text-tomato flex items-center gap-2 font-bold cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-tomato" />
                  <span>Report</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onBlockUser(message.authorId)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-ivory text-ink/80 flex items-center gap-2 font-bold cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-ink/60" />
                  <span>Block person</span>
                </button>
              </>
            )}

            {isOwn && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onDelete(message.id)
                }}
                className="w-full text-left px-3 py-2 hover:bg-tomato/10 text-tomato flex items-center gap-2 font-bold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-tomato" />
                <span>Delete</span>
              </button>
            )}

            {isOrganizer && !isOwn && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onRemoveByOrganizer(message.id)
                }}
                className="w-full text-left px-3 py-2 hover:bg-tomato/10 text-tomato flex items-center gap-2 font-bold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-tomato" />
                <span>Remove message</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emoji popover triggered from menu */}
      <EmojiPickerPopover
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectReaction={onToggleReaction}
      />
    </div>
  )
}
