"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { CHAT_ROOMS, ReactionKey, ReportReason } from "@/lib/constants/chat"
import { chatApi, ChatRateLimitError } from "@/lib/api/chat"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"
import { SEED_USERS, SEED_TASKS } from "@/lib/mocks/seed-data"
import { FICTIONAL_USERS } from "@/lib/mocks/fictional-data"
import { ChatRoomList } from "@/components/chat/ChatRoomList"
import { ChatConversation } from "@/components/chat/ChatConversation"
import { RoomInfoDrawer } from "@/components/chat/RoomInfoDrawer"
import { ReportMessageDialog } from "@/components/chat/ReportMessageDialog"
import { ConfirmDeleteDialog } from "@/components/chat/ConfirmDeleteDialog"
import { BlockedUsersDialog } from "@/components/chat/BlockedUsersDialog"
import { ChatRulesDialog } from "@/components/chat/ChatRulesDialog"
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer"
import { toast } from "sonner"

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const currentRoomParam = searchParams.get("room") || "everyone"
  const activeRoom =
    CHAT_ROOMS.find((r) => r.id === currentRoomParam) || CHAT_ROOMS[0]

  // Track whether mobile user is viewing conversation or room list
  const [mobileView, setMobileView] = React.useState<"rooms" | "conversation">("conversation")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [messagesMap, setMessagesMap] = React.useState<Record<string, Message[]>>({})
  const [lastReadMap, setLastReadMap] = React.useState<Record<string, string | null>>({})
  const [pinnedMessage, setPinnedMessage] = React.useState<Message | null>(null)
  const [mutedRoomIds, setMutedRoomIds] = React.useState<string[]>([])
  const [isSending, setIsSending] = React.useState(false)

  // Safety & Dialog States
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [blockedOpen, setBlockedOpen] = React.useState(false)
  const [roomInfoOpen, setRoomInfoOpen] = React.useState(false)
  const [reportTargetId, setReportTargetId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; isOrganizer: boolean } | null>(null)
  const [blockedUserIds, setBlockedUserIds] = React.useState<string[]>([])
  const [slowModeActive, setSlowModeActive] = React.useState(false)
  const [slowModeCountdown, setSlowModeCountdown] = React.useState(0)

  // Selected task state for TaskDetailDrawer
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
  const selectedTask = React.useMemo(() => {
    return SEED_TASKS.find((t) => t.id === selectedTaskId)
  }, [selectedTaskId])

  // Hydrate blocked users, muted rooms, rules acknowledgement, and slow mode from sessionStorage
  React.useEffect(() => {
    try {
      const storedBlocked = sessionStorage.getItem("the-movement:chat:blocked-users")
      if (storedBlocked) {
        setBlockedUserIds(JSON.parse(storedBlocked))
      }
      const storedMuted = sessionStorage.getItem("the-movement:chat:muted-rooms")
      if (storedMuted) {
        setMutedRoomIds(JSON.parse(storedMuted))
      }
      const rulesAck = sessionStorage.getItem("the-movement:chat:rules-acknowledged")
      if (rulesAck !== "true") {
        setRulesOpen(true)
      }
      const slow = sessionStorage.getItem(`the-movement:chat:slow-mode:${activeRoom.id}`) === "true"
      setSlowModeActive(slow)
    } catch {}
  }, [activeRoom.id])

  // Countdown timer for slow mode
  React.useEffect(() => {
    if (slowModeCountdown <= 0) return
    const timer = setInterval(() => {
      setSlowModeCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [slowModeCountdown])

  // Build users map for fast lookup
  const usersMap = React.useMemo<Record<string, User>>(() => {
    const map: Record<string, User> = {}
    for (const u of SEED_USERS) {
      map[u.id] = u
    }
    for (const u of FICTIONAL_USERS) {
      map[u.id] = u
    }
    if (user) {
      map[user.id] = user
    }
    return map
  }, [user])

  // Organizers in this room (tier === 3)
  const roomOrganizers = React.useMemo(() => {
    return Object.values(usersMap).filter((u) => u.tier === 3)
  }, [usersMap])

  // Load messages and pinned message for the active room
  const loadMessages = React.useCallback(async (roomId: string) => {
    try {
      const res = await chatApi.listMessages(roomId)
      setMessages(res.messages)
      setMessagesMap((prev) => ({
        ...prev,
        [roomId]: res.messages,
      }))
      const pinned = await chatApi.getPinnedMessage(roomId)
      setPinnedMessage(pinned)
    } catch {
      // Fallback
    }
  }, [])

  // Initial load and whenever active room changes
  React.useEffect(() => {
    loadMessages(activeRoom.id)
    setLastReadMap((prev) => ({
      ...prev,
      [activeRoom.id]: new Date().toISOString(),
    }))
  }, [activeRoom.id, loadMessages])

  // Preload messages for all rooms so unread counts in room list are accurate
  React.useEffect(() => {
    for (const r of CHAT_ROOMS) {
      chatApi.listMessages(r.id).then((res) => {
        setMessagesMap((prev) => ({
          ...prev,
          [r.id]: res.messages,
        }))
      })
    }
  }, [])

  // Subscribe to realtime / cross-tab broadcast events for the active room
  React.useEffect(() => {
    const unsubscribe = chatApi.subscribe(activeRoom.id, (event) => {
      if (event.type === "message_created" && event.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.message!.id)) return prev
          return [...prev, event.message!]
        })
      } else if (event.type === "message_updated" && event.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.message!.id ? event.message! : m))
        )
      } else if (event.type === "message_deleted" && event.message) {
        setMessages((prev) => prev.filter((m) => m.id !== event.message!.id))
      } else if (event.type === "message_pinned") {
        chatApi.getPinnedMessage(activeRoom.id).then(setPinnedMessage)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [activeRoom.id])

  // Handle room selection
  const handleSelectRoom = (roomId: string) => {
    router.push(`/chat?room=${roomId}`)
    setMobileView("conversation")
  }

  // Handle message submission (supports replies, task sharing, and slow mode cooldown)
  const handleSendMessage = async (text: string, replyToId?: string | null, taskRef?: string | null) => {
    setIsSending(true)
    try {
      const authorId = user?.id || SEED_USERS[0]?.id
      const newMsg = await chatApi.sendMessage(
        activeRoom.id,
        text,
        replyToId,
        taskRef,
        authorId
      )

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })

      // Mark current room read
      setLastReadMap((prev) => ({
        ...prev,
        [activeRoom.id]: new Date().toISOString(),
      }))

      // If slow mode is active, trigger 10s cooldown
      if (slowModeActive) {
        setSlowModeCountdown(10)
      }
    } catch (err: unknown) {
      if (err instanceof ChatRateLimitError) {
        toast.warning(err.message)
      } else {
        toast.error("Could not send message. Please check your connection.")
      }
      throw err
    } finally {
      setIsSending(false)
    }
  }

  // Handle reaction toggle
  const handleToggleReaction = async (messageId: string, key: ReactionKey) => {
    try {
      const updated = await chatApi.toggleReaction(messageId, key, user?.id)
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      )
    } catch (err: unknown) {
      if (err instanceof ChatRateLimitError) {
        toast.warning(err.message)
      } else {
        toast.error("Could not toggle reaction.")
      }
    }
  }

  // Handle message pinning / unpinning (Tier 3 organizers only)
  const handleTogglePin = async (messageId: string) => {
    if (user?.tier !== 3) {
      toast.error("Only Tier 3 organizers can pin messages.")
      return
    }

    try {
      const isAlreadyPinned = pinnedMessage?.id === messageId
      const nextPinnedId = isAlreadyPinned ? null : messageId
      await chatApi.pinMessage(activeRoom.id, nextPinnedId)

      const nextPinned = nextPinnedId
        ? messages.find((m) => m.id === nextPinnedId) || null
        : null
      setPinnedMessage(nextPinned)

      toast.success(isAlreadyPinned ? "Message unpinned." : "Message pinned to room header.")
    } catch {
      toast.error("Could not update pinned message.")
    }
  }

  // Toggle slow mode for room (Tier 3 organizers)
  const handleToggleSlowMode = () => {
    if (user?.tier !== 3) {
      toast.error("Only Tier 3 organizers can toggle slow mode.")
      return
    }
    const next = !slowModeActive
    setSlowModeActive(next)
    try {
      sessionStorage.setItem(`the-movement:chat:slow-mode:${activeRoom.id}`, String(next))
    } catch {}
    toast.success(next ? "Slow mode enabled (10s cooldown)." : "Slow mode disabled.")
  }

  // Toggle mute for room
  const handleToggleMute = () => {
    const isMuted = mutedRoomIds.includes(activeRoom.id)
    const next = isMuted
      ? mutedRoomIds.filter((id) => id !== activeRoom.id)
      : [...mutedRoomIds, activeRoom.id]
    setMutedRoomIds(next)
    try {
      sessionStorage.setItem("the-movement:chat:muted-rooms", JSON.stringify(next))
    } catch {}
    toast.info(isMuted ? `Unmuted ${activeRoom.name}.` : `Muted ${activeRoom.name}.`)
  }

  // Mark all as read in room
  const handleMarkAllAsRead = () => {
    setLastReadMap((prev) => ({
      ...prev,
      [activeRoom.id]: new Date().toISOString(),
    }))
    toast.success(`Marked ${activeRoom.name} as read.`)
  }

  // Handle confirmed deletion or organizer removal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const { id, isOrganizer } = deleteTarget
    if (isOrganizer) {
      await chatApi.removeMessageByOrganizer(id)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, status: "removed", text: "Message removed by an organizer", reactions: {} }
            : m
        )
      )
      toast.success("Message removed by organizer.")
    } else {
      await chatApi.deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success("Message deleted.")
    }
  }

  // Handle blocking a person
  const handleBlockUser = (authorId: string) => {
    if (blockedUserIds.includes(authorId)) return
    const next = [...blockedUserIds, authorId]
    setBlockedUserIds(next)
    try {
      sessionStorage.setItem("the-movement:chat:blocked-users", JSON.stringify(next))
    } catch {}
    const blockedName = usersMap[authorId]?.display_name || "Volunteer"
    toast.info(`Blocked ${blockedName}. Their messages are now hidden on this device.`)
  }

  // Handle unblocking a person
  const handleUnblockUser = (userId: string) => {
    const next = blockedUserIds.filter((id) => id !== userId)
    setBlockedUserIds(next)
    try {
      sessionStorage.setItem("the-movement:chat:blocked-users", JSON.stringify(next))
    } catch {}
    const unblockedName = usersMap[userId]?.display_name || "Volunteer"
    toast.info(`Unblocked ${unblockedName}.`)
  }

  // Handle submitting report
  const handleSubmitReport = async (messageId: string, reason: ReportReason, note?: string) => {
    await chatApi.reportMessage(messageId, reason, note)
  }

  return (
    <main
      id="main-content"
      className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-ivory"
    >
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {/* Left: Room List (Visible on desktop; on mobile only when mobileView === 'rooms') */}
        <div
          className={`w-full md:w-80 md:border-r-2 md:border-ink bg-ivory shrink-0 h-full ${
            mobileView === "rooms" ? "flex flex-col" : "hidden md:flex md:flex-col"
          }`}
        >
          <ChatRoomList
            activeRoomId={activeRoom.id}
            onSelectRoom={handleSelectRoom}
            messagesMap={messagesMap}
            lastReadMap={lastReadMap}
            mutedRoomIds={mutedRoomIds}
            currentUserId={user?.id}
            blockedIds={blockedUserIds}
          />
        </div>

        {/* Right: Active Conversation (Visible on desktop; on mobile only when mobileView === 'conversation') */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-full ${
            mobileView === "conversation" ? "flex" : "hidden md:flex"
          }`}
        >
          <ChatConversation
            room={activeRoom}
            messages={messages}
            usersMap={usersMap}
            tasks={SEED_TASKS}
            currentUserId={user?.id}
            currentUserTier={user?.tier || 1}
            pinnedMessage={pinnedMessage}
            blockedIds={blockedUserIds}
            isSlowMode={slowModeActive}
            slowModeCountdown={slowModeCountdown}
            onToggleSlowMode={handleToggleSlowMode}
            onOpenRules={() => setRulesOpen(true)}
            onOpenBlocked={() => setBlockedOpen(true)}
            onOpenInfo={() => setRoomInfoOpen(true)}
            onBackToRooms={() => setMobileView("rooms")}
            onSendMessage={handleSendMessage}
            onToggleReaction={handleToggleReaction}
            onTogglePin={handleTogglePin}
            onDeleteMessage={(id) => setDeleteTarget({ id, isOrganizer: false })}
            onRemoveMessageByOrganizer={(id) => setDeleteTarget({ id, isOrganizer: true })}
            onReportMessage={(id) => setReportTargetId(id)}
            onBlockUser={handleBlockUser}
            isSending={isSending}
            onSelectTask={(taskId) => setSelectedTaskId(taskId)}
          />
        </div>
      </div>

      {/* Room Info Drawer */}
      <RoomInfoDrawer
        open={roomInfoOpen}
        onClose={() => setRoomInfoOpen(false)}
        room={activeRoom}
        organizers={roomOrganizers}
        isMuted={mutedRoomIds.includes(activeRoom.id)}
        blockedCount={blockedUserIds.length}
        onToggleMute={handleToggleMute}
        onMarkAllAsRead={handleMarkAllAsRead}
        onOpenRules={() => setRulesOpen(true)}
        onOpenBlocked={() => setBlockedOpen(true)}
      />

      {/* Safety & Moderation Dialogs */}
      <ReportMessageDialog
        open={Boolean(reportTargetId)}
        onOpenChange={(open) => !open && setReportTargetId(null)}
        messageId={reportTargetId}
        onSubmitReport={handleSubmitReport}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        isOrganizerRemoval={deleteTarget?.isOrganizer}
        onConfirm={handleConfirmDelete}
      />

      <BlockedUsersDialog
        open={blockedOpen}
        onOpenChange={setBlockedOpen}
        blockedUserIds={blockedUserIds}
        usersMap={usersMap}
        onUnblock={handleUnblockUser}
      />

      <ChatRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />

      {/* Shared Task Drawer integration */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          isOpen={Boolean(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
          task={selectedTask}
          usersMap={usersMap}
          currentUser={user}
          isSaved={false}
          onToggleSave={() => {}}
          onClaim={async () => {}}
          onWithdraw={async () => {}}
          onMarkComplete={async () => {}}
          onPeerVote={async () => {}}
          onOrganizerOverride={async () => {}}
          onCancelTask={async () => {}}
        />
      )}
    </main>
  )
}
