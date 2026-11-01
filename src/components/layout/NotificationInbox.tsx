"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { SEED_ANNOUNCEMENTS, SEED_SIGNATURES, SEED_TASKS } from "@/lib/mocks/seed-data"
import { CHAT_ROOMS } from "@/lib/constants/chat"
import { Message } from "@/lib/schemas/chat.schema"
import { Bell, Check, Megaphone, CheckSquare, X, MessageSquare, Pin } from "lucide-react"

export interface NotificationInboxProps {
  onItemClick?: () => void
}

export interface ChatNotificationItem {
  id: string
  type: "mention" | "pin"
  roomId: string
  roomName: string
  text: string
}

export function useNotificationCounts() {
  const { user } = useAuth()

  return React.useMemo(() => {
    if (!user) {
      return { total: 0, pendingAnnouncements: [], pendingTasks: [], chatNotifications: [] }
    }

    // Announcements requiring signature: if Tier 2 or 3
    const isVerifierOrOrganizer = user.tier >= 2
    const userSignedAnnouncementIds = new Set(
      SEED_SIGNATURES.filter((s) => s.signed_by === user.id).map((s) => s.announcement_id)
    )
    const pendingAnnouncements = isVerifierOrOrganizer
      ? SEED_ANNOUNCEMENTS.filter(
          (a) => !userSignedAnnouncementIds.has(a.id) && a.created_by !== user.id
        )
      : []

    // Tasks needing verification
    const pendingTasks = isVerifierOrOrganizer
      ? SEED_TASKS.filter((t) => t.status === "pending_verification")
      : []

    // Chat Notifications (mentions of user and pinned messages in non-muted rooms)
    const chatNotifications: ChatNotificationItem[] = []
    if (typeof window !== "undefined") {
      try {
        const mutedRaw = sessionStorage.getItem("the-movement:chat:muted-rooms")
        const mutedRooms: string[] = mutedRaw ? JSON.parse(mutedRaw) : []
        const mutedSet = new Set(mutedRooms)

        for (const room of CHAT_ROOMS) {
          const raw = sessionStorage.getItem(`the-movement:chat:messages:${room.id}`)
          if (raw) {
            const msgs: Message[] = JSON.parse(raw)
            const pinnedId = sessionStorage.getItem(`the-movement:chat:pinned:${room.id}`)

            for (const m of msgs) {
              if (m.status === "removed") continue

              // Mentions of current user always notify
              if (m.mentions && m.mentions.includes(user.id)) {
                chatNotifications.push({
                  id: `mention-${m.id}`,
                  type: "mention",
                  roomId: room.id,
                  roomName: room.name,
                  text: m.text,
                })
              }
              // Pinned messages in room notify if not muted
              else if (pinnedId && m.id === pinnedId && !mutedSet.has(room.id)) {
                chatNotifications.push({
                  id: `pin-${m.id}`,
                  type: "pin",
                  roomId: room.id,
                  roomName: room.name,
                  text: m.text,
                })
              }
            }
          }
        }
      } catch {}
    }

    const total =
      pendingAnnouncements.length + pendingTasks.length + chatNotifications.length

    return {
      total,
      pendingAnnouncements,
      pendingTasks,
      chatNotifications,
    }
  }, [user])
}

export function NotificationBellButton() {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const { total, pendingAnnouncements, pendingTasks, chatNotifications } =
    useNotificationCounts()

  // Close on outside click or Esc
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications: ${total} pending`}
        aria-expanded={open}
        className="relative p-2 rounded-sm border-2 border-ink bg-white hover:bg-ivory text-ink shadow-hard-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tomato text-white text-[10px] font-black flex items-center justify-center border-2 border-ink leading-none">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notification inbox"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-chunky border-2 border-ink bg-white p-3 shadow-hard-md z-50 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-ink/10">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-ink font-sans">
                Notifications
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-lime text-ink border border-ink">
                {total} pending
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notification popover"
              className="p-1 rounded-sm text-ink/60 hover:text-ink hover:bg-ivory"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of items */}
          <div className="max-h-72 overflow-y-auto space-y-2">
            {total === 0 ? (
              <div className="py-8 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-lime/20 border border-ink flex items-center justify-center mx-auto text-ink">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <p className="text-xs font-bold text-ink">You are all caught up</p>
                <p className="text-[11px] text-ink/60">No pending signatures, verifications, or mentions.</p>
              </div>
            ) : (
              <>
                {/* Chat Notifications */}
                {chatNotifications.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat?room=${c.roomId}`}
                    onClick={() => setOpen(false)}
                    className="block p-2.5 rounded-sm bg-lime/15 border-2 border-ink/20 hover:border-ink hover:bg-white transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-ink">
                        {c.type === "mention" ? (
                          <>
                            <MessageSquare className="w-3 h-3 text-cobalt" />
                            <span>Mentioned in {c.roomName}</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3 text-sun fill-sun" />
                            <span>Pinned in {c.roomName}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-ink/50 font-bold">Chat</span>
                    </div>
                    <p className="text-xs font-black text-ink line-clamp-1 font-sans">
                      {c.text}
                    </p>
                  </Link>
                ))}

                {/* Announcement Signatures */}
                {pendingAnnouncements.map((ann) => (
                  <Link
                    key={ann.id}
                    href="/feed"
                    onClick={() => setOpen(false)}
                    className="block p-2.5 rounded-sm bg-ivory border-2 border-ink/20 hover:border-ink hover:bg-white transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cobalt">
                        <Megaphone className="w-3 h-3" />
                        <span>Signature needed</span>
                      </span>
                      <span className="text-[10px] text-ink/50 font-bold">Needs you</span>
                    </div>
                    <p className="text-xs font-black text-ink line-clamp-1 font-sans">
                      {ann.title}
                    </p>
                    <p className="text-[11px] text-ink/70 line-clamp-1 font-sans">
                      {ann.body}
                    </p>
                  </Link>
                ))}

                {/* Verification Tasks */}
                {pendingTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks?task=${t.id}&tab=verification`}
                    onClick={() => setOpen(false)}
                    className="block p-2.5 rounded-sm bg-sun/10 border-2 border-ink/20 hover:border-ink hover:bg-white transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-ink">
                        <CheckSquare className="w-3 h-3 text-cobalt" />
                        <span>Verify completion</span>
                      </span>
                      <span className="text-[10px] font-bold text-ink/60">{t.reward_points} pts</span>
                    </div>
                    <p className="text-xs font-black text-ink line-clamp-1 font-sans">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-ink/70 line-clamp-1">
                      Awaiting peer verification consensus.
                    </p>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
