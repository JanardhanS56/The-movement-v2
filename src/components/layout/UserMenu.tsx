"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserTier } from "@/lib/schemas/user.schema"
import {
  getStoredProfilePhoto,
  getStoredTextSize,
  setStoredTextSize,
  TextSize,
} from "@/lib/ui-prefs"
import { ShortcutsDialog } from "./ShortcutsDialog"
import { toast } from "sonner"
import {
  LogOut,
  Type,
  EyeOff,
  Eye,
  Keyboard,
  Wrench,
  ChevronUp,
} from "lucide-react"

export interface UserMenuProps {
  collapsed?: boolean
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, signOut, openDemoDrawer } = useAuth()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [textSize, setTextSizeState] = React.useState<TextSize>("normal")
  const [discreetMode, setDiscreetMode] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Initialize preferences
  React.useEffect(() => {
    setTextSizeState(getStoredTextSize())
    try {
      const isDiscreet = sessionStorage.getItem("the-movement:discreet-mode") === "true"
      setDiscreetMode(isDiscreet)
      if (isDiscreet) {
        document.title = "Notes"
        document.documentElement.setAttribute("data-discreet", "true")
      }
    } catch {}
  }, [])

  // Close menu on outside click or Esc
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  if (!user) return null

  const userPhoto = !discreetMode ? getStoredProfilePhoto(user.id) || user.avatar_url : null

  const handleTextSizeChange = (newSize: TextSize) => {
    setTextSizeState(newSize)
    setStoredTextSize(newSize)
    toast.success(`Text size set to ${newSize}`)
  }

  const handleToggleDiscreetMode = () => {
    const next = !discreetMode
    setDiscreetMode(next)
    try {
      sessionStorage.setItem("the-movement:discreet-mode", String(next))
      if (next) {
        document.title = "Notes"
        document.documentElement.setAttribute("data-discreet", "true")
        toast.info("Discreet mode active. Photos hidden and tab renamed to Notes.")
      } else {
        document.title = "The Movement"
        document.documentElement.removeAttribute("data-discreet")
        toast.info("Discreet mode turned off.")
      }
    } catch {}
  }

  if (collapsed) {
    return (
      <div ref={containerRef} className="relative flex flex-col items-center py-2 border-t-2 border-ink bg-white/50">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={`User menu for ${user.display_name}`}
          className="p-1 rounded-sm border-2 border-transparent hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
        >
          <UserAvatar name={user.display_name} avatarUrl={userPhoto} className="h-8 w-8" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-14 bottom-2 z-50 w-64 rounded-chunky border-2 border-ink bg-white p-3 shadow-hard-md space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-ink/20">
              <UserAvatar name={user.display_name} avatarUrl={userPhoto} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{user.display_name}</p>
                <TierBadge tier={user.tier as UserTier} showIcon={false} className="text-xs py-0 px-1" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleToggleDiscreetMode}
                className="w-full text-left px-2 py-1.5 rounded-sm text-xs font-bold flex items-center justify-between hover:bg-ivory text-ink"
              >
                <span className="flex items-center gap-2">
                  {discreetMode ? <Eye className="w-3.5 h-3.5 text-cobalt" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Discreet mode</span>
                </span>
                <span className={`text-[10px] px-1 py-0.5 rounded-xs border ${discreetMode ? "bg-lime border-ink" : "bg-ivory border-ink/30"}`}>
                  {discreetMode ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setShortcutsOpen(true)
                }}
                className="w-full text-left px-2 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 hover:bg-ivory text-ink"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openDemoDrawer()
                }}
                className="w-full text-left px-2 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 hover:bg-ivory text-ink"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Demo tools</span>
              </button>
            </div>

            <div className="pt-2 border-t border-ink/20">
              <button
                type="button"
                onClick={signOut}
                className="w-full text-left px-2 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 text-tomato hover:bg-tomato/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative p-3 border-t-2 border-ink bg-white/70">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="User settings and preferences menu"
        className="w-full flex items-center justify-between gap-2 p-1.5 rounded-sm border-2 border-transparent hover:border-ink hover:bg-ivory transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar name={user.display_name} avatarUrl={userPhoto} />
          <div className="min-w-0 text-left">
            <p className="text-xs font-black text-ink truncate font-sans">
              {user.display_name}
            </p>
            <div className="flex items-center gap-1.5">
              <TierBadge tier={user.tier as UserTier} showIcon={false} className="text-xs py-0 px-1 mt-0.5" />
              {discreetMode && (
                <span className="text-[9px] font-black uppercase tracking-wider bg-ink text-white px-1 py-0.5 rounded-xs">
                  Discreet
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronUp className={`w-4 h-4 text-ink/60 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Menu */}
      {menuOpen && (
        <div
          role="menu"
          aria-label="User preferences and settings"
          className="absolute left-3 right-3 bottom-full mb-2 z-50 rounded-chunky border-2 border-ink bg-white p-3 shadow-hard-md space-y-3"
        >
          {/* Text Size Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-ink">
              <Type className="w-3.5 h-3.5" />
              <span>Text size</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["normal", "large"] as TextSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleTextSizeChange(size)}
                  className={`py-1 text-xs font-bold rounded-sm border-2 transition-all cursor-pointer capitalize ${
                    textSize === size
                      ? "bg-lime border-ink text-ink shadow-hard-xs"
                      : "border-ink/20 bg-ivory/50 text-ink/70 hover:bg-ivory"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Discreet Mode */}
          <div className="pt-2 border-t border-ink/10">
            <button
              type="button"
              onClick={handleToggleDiscreetMode}
              className="w-full flex items-center justify-between p-1.5 rounded-sm hover:bg-ivory border-2 border-transparent text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {discreetMode ? <Eye className="w-4 h-4 text-cobalt" /> : <EyeOff className="w-4 h-4 text-ink/70" />}
                <div>
                  <p className="text-xs font-black text-ink">Discreet mode</p>
                  <p className="text-[10px] text-ink/60">Hide photos, rename tab</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-sm border-2 border-ink ${
                  discreetMode ? "bg-lime text-ink" : "bg-ivory text-ink/50"
                }`}
              >
                {discreetMode ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="pt-2 border-t border-ink/10 space-y-1">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setShortcutsOpen(true)
              }}
              className="w-full flex items-center gap-2 p-1.5 rounded-sm hover:bg-ivory text-xs font-bold text-ink cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard shortcuts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                openDemoDrawer()
              }}
              className="w-full flex items-center gap-2 p-1.5 rounded-sm hover:bg-ivory text-xs font-bold text-ink cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Demo tools</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-2 border-t border-ink/10">
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-sm bg-tomato/10 border-2 border-tomato text-tomato text-xs font-black hover:bg-tomato hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
