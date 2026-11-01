"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Monogram } from "@/components/shared/Monogram"
import { Button } from "@/components/ui/button"
import { MovementSwitcher } from "./MovementSwitcher"
import { UserMenu } from "./UserMenu"
import { useNotificationCounts } from "./NotificationInbox"
import { getTaskCounts } from "@/lib/mocks/fictional-data"
import { SEED_TASKS, SEED_TASK_CLAIMS } from "@/lib/mocks/seed-data"
import { getStoredSavedTasks } from "@/lib/ui-prefs"
import { CreateMovementDialog } from "./CreateMovementDialog"
import {
  Megaphone,
  MapPin,
  CheckSquare,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bookmark,
  ShieldCheck,
  ListTodo,
  PlusCircle,
  MessageSquare,
  Hash,
} from "lucide-react"
import { CHAT_ROOMS } from "@/lib/constants/chat"
import { Message } from "@/lib/schemas/chat.schema"
import { getUnreadCount, getMentionCount } from "@/lib/mocks/chat-pure"
import { buildFictionalDemoMessages } from "@/lib/api/chat"

interface ChatRoomStat {
  unread: number
  mentions: number
}

function useChatStats(currentUserId?: string | null) {
  const [stats, setStats] = React.useState<Record<string, ChatRoomStat>>({
    everyone: { unread: 0, mentions: 0 },
    "coastal-action-front": { unread: 0, mentions: 0 },
    "help-questions": { unread: 0, mentions: 0 },
  })

  const refreshStats = React.useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const mutedRaw = sessionStorage.getItem("the-movement:chat:muted-rooms")
      const mutedRooms: string[] = mutedRaw ? JSON.parse(mutedRaw) : []
      const mutedSet = new Set(mutedRooms)

      const blockedRaw = sessionStorage.getItem("the-movement:chat:blocked-users")
      const blockedIds: string[] = blockedRaw ? JSON.parse(blockedRaw) : []

      const newStats: Record<string, ChatRoomStat> = {}

      for (const room of CHAT_ROOMS) {
        const raw = sessionStorage.getItem(`the-movement:chat:messages:${room.id}`)
        let msgs: Message[] = []
        if (raw) {
          try {
            msgs = JSON.parse(raw)
          } catch {}
        } else {
          const allSeeds = buildFictionalDemoMessages()
          msgs = allSeeds[room.id] || []
        }

        const lastRead = sessionStorage.getItem(`the-movement:chat:last-read:${room.id}`)
        const isMuted = mutedSet.has(room.id)
        const unread = isMuted ? 0 : getUnreadCount(room.id, lastRead, msgs, blockedIds)
        const mentions = currentUserId
          ? getMentionCount(currentUserId, lastRead, msgs, blockedIds)
          : 0

        newStats[room.id] = { unread, mentions }
      }
      setStats(newStats)
    } catch {}
  }, [currentUserId])

  React.useEffect(() => {
    refreshStats()

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel("the-movement:chat:events")
      bc.onmessage = () => {
        refreshStats()
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("the-movement:chat:")) {
        refreshStats()
      }
    }
    window.addEventListener("storage", handleStorage)

    const interval = setInterval(refreshStats, 3000)

    return () => {
      if (bc) bc.close()
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [refreshStats])

  return stats
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const [activeRoomParam, setActiveRoomParam] = React.useState<string | null>(null)
  const { pendingAnnouncements, pendingTasks } = useNotificationCounts()
  const chatStats = useChatStats(user?.id)

  React.useEffect(() => {
    if (typeof window !== "undefined" && pathname === "/chat") {
      const params = new URLSearchParams(window.location.search)
      setActiveRoomParam(params.get("room") || "everyone")
    } else {
      setActiveRoomParam(null)
    }
  }, [pathname])

  // Task sub-link counts
  const savedTaskIds = React.useMemo(() => {
    return getStoredSavedTasks()
  }, [])

  const taskCounts = React.useMemo(() => {
    return getTaskCounts(user, SEED_TASKS, SEED_TASK_CLAIMS, savedTaskIds)
  }, [user, savedTaskIds])

  const totalChatUnread = React.useMemo(() => {
    return Object.values(chatStats).reduce((acc, curr) => acc + curr.unread, 0)
  }, [chatStats])

  const chatSubLinks = React.useMemo(() => {
    return CHAT_ROOMS.map((room) => ({
      id: room.id,
      label: room.name,
      href: `/chat?room=${room.id}`,
      unreadCount: chatStats[room.id]?.unread || 0,
      mentionCount: chatStats[room.id]?.mentions || 0,
    }))
  }, [chatStats])

  const navItems = [
    {
      label: "Feed",
      href: "/feed",
      icon: Megaphone,
      needsYouCount: pendingAnnouncements.length,
    },
    {
      label: "Heatmap",
      href: "/heatmap",
      icon: MapPin,
      needsYouCount: 0,
    },
    {
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      needsYouCount: pendingTasks.length,
      subLinks: [
        { label: "My tasks", href: "/tasks?tab=mine", count: taskCounts.mine, icon: ListTodo },
        { label: "Saved", href: "/tasks?tab=saved", count: taskCounts.saved, icon: Bookmark },
        {
          label: "Needs my verification",
          href: "/tasks?tab=verification",
          count: taskCounts.needsVerification,
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "Chat",
      href: "/chat",
      icon: MessageSquare,
      needsYouCount: totalChatUnread,
    },
    {
      label: "My Profile",
      href: user ? `/u/${user.handle || user.id}` : "/sign-in",
      icon: UserIcon,
      needsYouCount: 0,
    },
  ]

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={`hidden md:flex flex-col border-r-2 border-ink bg-ivory transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 1. Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b-2 border-ink">
        {!collapsed && (
          <Link
            href="/feed"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt rounded-sm"
          >
            <Monogram className="h-7 w-7 shrink-0" />
            <span className="font-black text-lg tracking-tight text-ink font-sans">
              The Movement
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          className="ml-auto text-ink hover:bg-ink/10 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* 2. Movement Switcher at the top */}
      <MovementSwitcher collapsed={collapsed} />

      {/* 3. Navigation Links */}
      <nav aria-label="Sidebar Links" className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${
                  isActive
                    ? "bg-lime text-ink font-black border-2 border-ink shadow-hard-xs"
                    : "text-ink/80 hover:bg-ink/5 hover:text-ink font-bold border-2 border-transparent"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && item.needsYouCount > 0 && (
                    <span
                      title={`${item.needsYouCount} items require your action`}
                      className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full bg-tomato text-white border border-ink leading-none tabular-nums"
                    >
                      {item.needsYouCount > 99 ? "99+" : item.needsYouCount}
                    </span>
                  )}
                </div>

                {/* "Needs you" count chip: hidden when 0 or when collapsed */}
                {!collapsed && item.needsYouCount > 0 && (
                  <span
                    title={`${item.needsYouCount} items require your action`}
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black rounded-full bg-tomato text-white border border-ink leading-none shadow-hard-xs shrink-0 tabular-nums"
                  >
                    {item.needsYouCount}
                  </span>
                )}
              </Link>

              {/* Tasks Sub-links: visible when expanded and count > 0 */}
              {!collapsed && item.subLinks && (
                <div className="pl-6 pr-1 py-1 space-y-1">
                  {item.subLinks.map((sub) => {
                    if (sub.count === 0) return null
                    const SubIcon = sub.icon

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xs text-xs font-semibold text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors border border-transparent hover:border-ink/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SubIcon className="w-3.5 h-3.5 text-ink/50" />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-ink/5 text-ink/80 border border-ink/15 tabular-nums">
                          {sub.count}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Chat Sub-links: visible when expanded */}
              {!collapsed && item.label === "Chat" && (
                <div className="pl-6 pr-1 py-1 space-y-1">
                  {chatSubLinks.map((room) => {
                    const isRoomActive =
                      pathname === "/chat" &&
                      (activeRoomParam === room.id || (!activeRoomParam && room.id === "everyone"))

                    return (
                      <Link
                        key={room.id}
                        href={room.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xs text-xs font-semibold transition-colors border ${
                          isRoomActive
                            ? "bg-ink/10 text-ink font-bold border-ink/30"
                            : "text-ink/70 hover:text-ink hover:bg-ink/5 border-transparent hover:border-ink/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className="w-3.5 h-3.5 text-ink/50 shrink-0" />
                          <span className="truncate">{room.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {room.mentionCount > 0 && (
                            <span
                              title={`${room.mentionCount} mentions`}
                              className="inline-flex items-center justify-center h-4 px-1 rounded-full bg-tomato text-white text-[9px] font-black border border-ink tabular-nums leading-none"
                            >
                              @{room.mentionCount}
                            </span>
                          )}
                          {room.unreadCount > 0 && (
                            <span
                              title={`${room.unreadCount} unread`}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-ink text-ivory border border-ink tabular-nums leading-none"
                            >
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Generous spacing break */}
        <div className="pt-4 border-t border-ink/10 space-y-2">
          {/* Quick link: Report from the field (Heatmap Check-in) */}
          <Link
            href="/heatmap"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-black bg-sun/20 border-2 border-ink text-ink shadow-hard-xs hover:bg-sun/40 transition-all"
            title={collapsed ? "Report from the field" : undefined}
          >
            <Radio className="w-4 h-4 text-ink shrink-0 animate-pulse" />
            {!collapsed && <span>Report from the field</span>}
          </Link>

          {user?.tier === 3 && (
            <div className="pt-1">
              <CreateMovementDialog
                trigger={
                  collapsed ? (
                    <button
                      type="button"
                      title="Create Movement"
                      className="w-10 h-10 mx-auto rounded-sm border-2 border-dashed border-ink/40 hover:border-ink hover:bg-ink/5 flex items-center justify-center text-ink cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span className="sr-only">Create Movement</span>
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </nav>

      {/* 4. User Menu at the bottom */}
      <UserMenu collapsed={collapsed} />
    </aside>
  )
}
