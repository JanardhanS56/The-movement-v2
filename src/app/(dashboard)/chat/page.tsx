"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { CHAT_ROOMS } from "@/lib/constants/chat"
import { chatApi, ChatRateLimitError } from "@/lib/api/chat"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"
import { SEED_USERS, SEED_TASKS } from "@/lib/mocks/seed-data"
import { FICTIONAL_USERS } from "@/lib/mocks/fictional-data"
import { ChatRoomList } from "@/components/chat/ChatRoomList"
import { ChatConversation } from "@/components/chat/ChatConversation"
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
  const [isSending, setIsSending] = React.useState(false)

  // Selected task state for TaskDetailDrawer
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
  const selectedTask = React.useMemo(() => {
    return SEED_TASKS.find((t) => t.id === selectedTaskId)
  }, [selectedTaskId])

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

  // Load messages for the active room
  const loadMessages = React.useCallback(async (roomId: string) => {
    try {
      const res = await chatApi.listMessages(roomId)
      setMessages(res.messages)
      setMessagesMap((prev) => ({
        ...prev,
        [roomId]: res.messages,
      }))
    } catch {
      // Fallback empty
    }
  }, [])

  // Initial load and whenever active room changes
  React.useEffect(() => {
    loadMessages(activeRoom.id)
    // Update lastRead time for this room
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

  // Handle message submission
  const handleSendMessage = async (text: string) => {
    setIsSending(true)
    try {
      const authorId = user?.id || SEED_USERS[0]?.id
      const newMsg = await chatApi.sendMessage(
        activeRoom.id,
        text,
        null,
        null,
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
            currentUserId={user?.id}
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
            currentUserId={user?.id}
            onBackToRooms={() => setMobileView("rooms")}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            onSelectTask={(taskId) => setSelectedTaskId(taskId)}
          />
        </div>
      </div>

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
