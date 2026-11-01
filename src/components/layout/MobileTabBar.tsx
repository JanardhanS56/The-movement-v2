"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useNotificationCounts } from "./NotificationInbox"
import { SupportDialog } from "./SupportDialog"
import { CommandPalette } from "./CommandPalette"
import { ShortcutsDialog } from "./ShortcutsDialog"
import { FICTIONAL_MOVEMENTS, getActiveMovementId, setActiveMovementId } from "@/lib/mocks/fictional-data"
import {
  Megaphone,
  MapPin,
  CheckSquare,
  User as UserIcon,
  MoreHorizontal,
  X,
  Heart,
  LogOut,
  Search,
  Wrench,
  Eye,
  EyeOff,
  Keyboard,
  Check,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

export function MobileTabBar() {
  const pathname = usePathname()
  const { user, signOut, openDemoDrawer } = useAuth()
  const { total } = useNotificationCounts()

  const [moreOpen, setMoreOpen] = React.useState(false)
  const [supportOpen, setSupportOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [activeMovementId, setActiveMovementIdState] = React.useState(FICTIONAL_MOVEMENTS[0].id)
  const [discreetMode, setDiscreetMode] = React.useState(false)

  React.useEffect(() => {
    setActiveMovementIdState(getActiveMovementId())
    try {
      setDiscreetMode(sessionStorage.getItem("the-movement:discreet-mode") === "true")
    } catch {}
  }, [])

  const tabs = [
    { label: "Feed", href: "/feed", icon: Megaphone },
    { label: "Heatmap", href: "/heatmap", icon: MapPin },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Profile", href: user ? `/u/${user.handle || user.id}` : "/sign-in", icon: UserIcon },
  ]

  const handleSelectMovement = (id: string) => {
    setActiveMovementId(id)
    setActiveMovementIdState(id)
    const mov = FICTIONAL_MOVEMENTS.find((m) => m.id === id)
    if (mov) toast.success(`Switched movement to ${mov.name}`)
  }

  const handleToggleDiscreet = () => {
    const next = !discreetMode
    setDiscreetMode(next)
    try {
      sessionStorage.setItem("the-movement:discreet-mode", String(next))
      if (next) {
        document.title = "Notes"
        document.documentElement.setAttribute("data-discreet", "true")
        toast.info("Discreet mode active.")
      } else {
        document.title = "The Movement"
        document.documentElement.removeAttribute("data-discreet")
        toast.info("Discreet mode off.")
      }
    } catch {}
  }

  const triggerQuickExit = () => {
    try {
      sessionStorage.clear()
    } catch {}
    window.location.replace("https://weather.com")
  }

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-ivory border-t-2 border-ink flex items-center justify-around px-1"
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt relative cursor-pointer ${
                isActive ? "text-ink font-black" : "text-ink/60 hover:text-ink font-bold"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-1 w-8 rounded-b-xs bg-lime border-b border-x border-ink" />
              )}
              <Icon className="h-5 w-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </Link>
          )
        })}

        {/* 5th Button: More Sheet */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Open more menu options"
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 text-xs text-ink/60 hover:text-ink font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt relative cursor-pointer"
        >
          {total > 0 && (
            <span className="absolute top-2 right-4 min-w-[16px] h-4 px-1 rounded-full bg-tomato text-white text-[9px] font-black flex items-center justify-center border border-ink">
              {total}
            </span>
          )}
          <MoreHorizontal className="h-5 w-5 mb-0.5" aria-hidden="true" />
          <span className="text-[11px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-more-title"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/60 backdrop-blur-xs md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-chunky border-t-2 border-x-2 border-ink bg-white p-5 shadow-hard-lg space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-ink/10">
              <h3 id="mobile-more-title" className="text-base font-black text-ink font-sans">
                Movement menu
              </h3>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Movement Switcher */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-black tracking-wider text-ink/60">
                Active movement
              </p>
              <div className="space-y-1">
                {FICTIONAL_MOVEMENTS.map((mov) => {
                  const isSelected = mov.id === activeMovementId
                  return (
                    <button
                      key={mov.id}
                      type="button"
                      onClick={() => handleSelectMovement(mov.id)}
                      className={`w-full text-left p-2.5 rounded-sm border-2 flex items-center justify-between min-h-[44px] ${
                        isSelected
                          ? "bg-lime border-ink font-bold text-ink shadow-hard-xs"
                          : "border-ink/20 bg-ivory text-ink/80"
                      }`}
                    >
                      <span className="text-xs truncate">{mov.name}</span>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions List (min-h-[44px] tap targets) */}
            <div className="space-y-2 pt-2 border-t border-ink/10">
              <Link
                href="/chat"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-lime border-2 border-ink text-xs font-bold text-ink min-h-[44px] shadow-hard-xs"
              >
                <MessageSquare className="w-4 h-4 text-ink" />
                <span>Community chat</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  setCommandOpen(true)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-ivory border-2 border-ink text-xs font-bold text-ink min-h-[44px]"
              >
                <Search className="w-4 h-4 text-cobalt" />
                <span>Search pages & tasks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  setSupportOpen(true)
                }}
                aria-label="Donate"
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-sun/20 border-2 border-ink text-xs font-bold text-ink min-h-[44px]"
              >
                <Heart className="w-4 h-4 text-ink fill-sun" />
                <span>Donate</span>
              </button>

              <button
                type="button"
                onClick={handleToggleDiscreet}
                className="w-full flex items-center justify-between p-3 rounded-sm bg-ivory border-2 border-ink text-xs font-bold text-ink min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  {discreetMode ? <Eye className="w-4 h-4 text-cobalt" /> : <EyeOff className="w-4 h-4" />}
                  <span>Discreet mode</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-xs border ${discreetMode ? "bg-lime border-ink" : "bg-white border-ink/30"}`}>
                  {discreetMode ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  setShortcutsOpen(true)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-ivory border-2 border-ink text-xs font-bold text-ink min-h-[44px]"
              >
                <Keyboard className="w-4 h-4" />
                <span>Keyboard shortcuts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  openDemoDrawer()
                }}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-ivory border-2 border-ink text-xs font-bold text-ink min-h-[44px]"
              >
                <Wrench className="w-4 h-4 text-cobalt" />
                <span>Demo switch persona</span>
              </button>

              <button
                type="button"
                onClick={triggerQuickExit}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-tomato/20 border-2 border-ink text-xs font-black text-ink min-h-[44px]"
              >
                <LogOut className="w-4 h-4 text-tomato" />
                <span>Quick exit (redirects to weather.com)</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    signOut()
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-sm bg-ink text-white font-bold text-xs min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  )
}
