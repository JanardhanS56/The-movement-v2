"use client"

import * as React from "react"
import { X, Keyboard } from "lucide-react"

export interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUTS = [
  { key: "Ctrl + K / ⌘K", description: "Open search and command palette" },
  { key: "Esc twice", description: "Quick exit (clears session and redirects to weather.com)" },
  { key: "Shift + ?", description: "Show keyboard shortcuts dialog" },
  { key: "T", description: "Navigate to Tasks board" },
  { key: "F", description: "Navigate to Feed announcements" },
  { key: "H", description: "Navigate to Heatmap check-ins" },
  { key: "P", description: "Navigate to My Profile" },
]

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-chunky border-2 border-ink bg-white p-6 shadow-hard-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b-2 border-ink/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cobalt" />
            <h3 id="shortcuts-dialog-title" className="text-base font-black text-ink font-sans">
              Keyboard shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close shortcuts dialog"
            className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-sm bg-ivory border border-ink/20"
            >
              <span className="text-xs text-ink/80 font-medium font-sans">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded-xs bg-white border-2 border-ink text-[11px] font-black text-ink shadow-hard-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full py-2 rounded-sm bg-ink text-white font-bold text-xs border-2 border-ink shadow-hard-xs hover:bg-ink/90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
