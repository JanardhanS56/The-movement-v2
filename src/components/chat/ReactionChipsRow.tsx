"use client"

import * as React from "react"
import { ReactionTotal } from "@/lib/mocks/chat-pure"
import { ReactionKey } from "@/lib/constants/chat"
import { User } from "@/lib/schemas/user.schema"
import { EmojiPickerPopover } from "./EmojiPickerPopover"
import { SmilePlus } from "lucide-react"

export interface ReactionChipsRowProps {
  totals: ReactionTotal[]
  onToggleReaction: (key: ReactionKey) => void
  usersMap: Record<string, User>
  disabled?: boolean
}

export function ReactionChipsRow({
  totals,
  onToggleReaction,
  usersMap,
  disabled = false,
}: ReactionChipsRowProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [hoveredKey, setHoveredKey] = React.useState<ReactionKey | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleChipMouseEnter = (key: ReactionKey) => {
    timerRef.current = setTimeout(() => {
      setHoveredKey(key)
    }, 400)
  }

  const handleChipMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHoveredKey(null)
  }

  if (totals.length === 0 && !pickerOpen) {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Add reaction"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-ink/40 hover:text-ink rounded-sm hover:bg-ink/5 transition-opacity cursor-pointer"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
        <EmojiPickerPopover
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectReaction={onToggleReaction}
        />
      </div>
    )
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5 mt-1.5">
      {totals.map((item) => {
        const reactionLabel = `${item.label}, ${item.count} ${
          item.count === 1 ? "person" : "people"
        }${item.hasReacted ? ", pressed" : ""}`

        const reactorNames = item.userIds
          .map((uid) => usersMap[uid]?.display_name || "Volunteer")
          .join(", ")

        return (
          <div key={item.key} className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => onToggleReaction(item.key)}
              onMouseEnter={() => handleChipMouseEnter(item.key)}
              onMouseLeave={handleChipMouseLeave}
              onFocus={() => handleChipMouseEnter(item.key)}
              onBlur={handleChipMouseLeave}
              aria-label={reactionLabel}
              aria-pressed={item.hasReacted}
              disabled={disabled}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95 ${
                item.hasReacted
                  ? "bg-lime/30 border-2 border-ink text-ink font-black shadow-hard-xs"
                  : "bg-white border-ink/40 text-ink/80 hover:border-ink hover:text-ink"
              }`}
            >
              <span aria-hidden="true">{item.glyph}</span>
              <span className="tabular-nums text-[11px]">{item.count}</span>
            </button>

            {/* "Who reacted" tooltip */}
            {hoveredKey === item.key && (
              <div
                role="tooltip"
                className="absolute bottom-full mb-1.5 left-0 z-30 px-2 py-1 bg-ink text-ivory text-[10px] font-bold rounded-xs shadow-hard-xs whitespace-nowrap pointer-events-none max-w-xs truncate"
              >
                {reactorNames}
              </div>
            )}
          </div>
        )
      })}

      {/* Add reaction button */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Add reaction"
          disabled={disabled}
          className="p-1 rounded-sm border border-dashed border-ink/40 hover:border-ink hover:bg-ink/5 text-ink/70 hover:text-ink cursor-pointer transition-colors"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>

        <EmojiPickerPopover
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectReaction={onToggleReaction}
        />
      </div>
    </div>
  )
}
