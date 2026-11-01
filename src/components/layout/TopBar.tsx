"use client"

import * as React from "react"
import { CommandPalette } from "./CommandPalette"
import { NotificationBellButton } from "./NotificationInbox"
import { SupportDialog } from "./SupportDialog"
import { Search, Heart, LogOut, WifiOff } from "lucide-react"

export interface TopBarProps {
  movementName?: string
}

export function TopBar({ movementName = "Coastal Action Front" }: TopBarProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)
  const [supportOpen, setSupportOpen] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(true)

  // Track online/offline status
  React.useEffect(() => {
    if (typeof window === "undefined") return
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Quick Exit: Clears sessionStorage and does location.replace to weather.com
  const triggerQuickExit = React.useCallback(() => {
    try {
      sessionStorage.clear()
    } catch {}
    window.location.replace("https://weather.com")
  }, [])

  // Double-Esc Listener for Quick Exit
  React.useEffect(() => {
    let lastEscTime = 0

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        const now = Date.now()
        if (now - lastEscTime < 500) {
          triggerQuickExit()
        }
        lastEscTime = now
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [triggerQuickExit])

  return (
    <>
      {/* 1. Offline Reactive Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-tomato text-white text-xs font-black border-b-2 border-ink shadow-hard-xs animate-in fade-in"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Changes will sync when reconnected.</span>
        </div>
      )}

      {/* 2. Top App Chrome Bar */}
      <header className="h-14 border-b-2 border-ink bg-ivory flex items-center justify-between px-4 sm:px-6">
        {/* Left: Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette search"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm bg-white border-2 border-ink text-ink shadow-hard-xs hover:bg-ivory transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
        >
          <Search className="w-3.5 h-3.5 text-ink/70" />
          <span className="text-xs font-bold text-ink/60 hidden sm:inline">Search app...</span>
          <kbd className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-xs bg-ink/5 border border-ink/20 text-ink">
            ⌘K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Support Movement Button */}
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            aria-label="Support the movement"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-sun/30 border-2 border-ink text-ink text-xs font-bold shadow-hard-xs hover:bg-sun/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            <Heart className="w-3.5 h-3.5 fill-sun text-ink" />
            <span className="hidden sm:inline">Support</span>
          </button>

          {/* Notification Bell */}
          <NotificationBellButton />

          {/* Quick Exit Button */}
          <button
            type="button"
            onClick={triggerQuickExit}
            title="Browser history may still show this site."
            aria-label="Quick exit to neutral site. Browser history may still show this site."
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-tomato/20 border-2 border-ink text-ink text-xs font-black shadow-hard-xs hover:bg-tomato hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick exit</span>

            {/* Custom accessible tooltip */}
            <span
              role="tooltip"
              className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-56 p-2 rounded-sm bg-ink text-white text-[11px] font-medium leading-tight shadow-hard-md pointer-events-none"
            >
              Leaves instantly to weather.com (or press Esc twice). Browser history may still show this site.
            </span>
          </button>
        </div>
      </header>

      {/* Modals */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} movementName={movementName} />
    </>
  )
}
