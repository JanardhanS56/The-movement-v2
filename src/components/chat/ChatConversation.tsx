"use client"

import * as React from "react"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"
import { Task } from "@/lib/schemas/task.schema"
import { ChatRoomDefinition, ReactionKey } from "@/lib/constants/chat"
import { ChatMessageItem } from "./ChatMessageItem"
import { ChatComposer } from "./ChatComposer"
import { PinnedMessageStrip } from "./PinnedMessageStrip"
import { ChatSearchBar } from "./ChatSearchBar"
import { getDayLabel } from "@/lib/date"
import { ArrowLeft, ArrowDown, Info, Shield, Clock, UserX, Search } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export interface ChatConversationProps {
  room: ChatRoomDefinition
  messages: Message[]
  usersMap: Record<string, User>
  tasks?: Task[]
  currentUserId?: string | null
  currentUserTier?: number
  pinnedMessage?: Message | null
  blockedIds?: string[]
  isSlowMode?: boolean
  slowModeCountdown?: number
  onToggleSlowMode?: () => void
  onOpenRules?: () => void
  onOpenBlocked?: () => void
  onOpenInfo?: () => void
  onBackToRooms?: () => void
  onSendMessage: (text: string, replyToId?: string | null, taskRef?: string | null) => Promise<void>
  onToggleReaction?: (messageId: string, key: ReactionKey) => void
  onTogglePin?: (messageId: string) => void
  onDeleteMessage?: (messageId: string) => void
  onRemoveMessageByOrganizer?: (messageId: string) => void
  onReportMessage?: (messageId: string) => void
  onBlockUser?: (authorId: string) => void
  isSending?: boolean
  onSelectTask?: (taskId: string) => void
}

export function ChatConversation({
  room,
  messages,
  usersMap,
  tasks = [],
  currentUserId,
  currentUserTier = 1,
  pinnedMessage,
  blockedIds = [],
  isSlowMode = false,
  slowModeCountdown = 0,
  onToggleSlowMode,
  onOpenRules,
  onOpenBlocked,
  onOpenInfo,
  onBackToRooms,
  onSendMessage,
  onToggleReaction,
  onTogglePin,
  onDeleteMessage,
  onRemoveMessageByOrganizer,
  onReportMessage,
  onBlockUser,
  isSending = false,
  onSelectTask,
}: ChatConversationProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [showScrollBottomButton, setShowScrollBottomButton] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(50)
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)
  const isNearBottomRef = React.useRef(true)

  const isOrganizer = currentUserTier === 3

  // Quick lookup map of messages by ID for reply quotes
  const messagesById = React.useMemo(() => {
    const map = new Map<string, Message>()
    for (const m of messages) {
      map.set(m.id, m)
    }
    return map
  }, [messages])

  // Track scroll position to decide whether to auto-scroll on new message
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNear = distanceFromBottom < 120
    isNearBottomRef.current = isNear
    setShowScrollBottomButton(!isNear)
  }

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior,
    })
    setShowScrollBottomButton(false)
  }

  // Jump to specific message element by ID
  const jumpToMessage = React.useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("bg-sun/20")
      setTimeout(() => {
        el.classList.remove("bg-sun/20")
      }, 1500)
    }
  }, [])

  // Auto-scroll on new messages if already near bottom
  React.useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("auto")
    }
  }, [messages.length])

  // Initial scroll to bottom on room change
  React.useEffect(() => {
    scrollToBottom("auto")
    setReplyingTo(null)
    setSearchOpen(false)
  }, [room.id])

  const displayedMessages = messages.slice(-visibleCount)
  const hasEarlierMessages = messages.length > displayedMessages.length

  const handleSend = async (text: string, taskRef?: string | null) => {
    const replyId = replyingTo ? replyingTo.id : null
    await onSendMessage(text, replyId, taskRef)
    setReplyingTo(null)
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-ivory">
      {/* 1. Header */}
      <header className="px-4 py-3 bg-white border-b-2 border-ink shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToRooms && (
            <button
              type="button"
              onClick={onBackToRooms}
              aria-label="Back to chat rooms list"
              className="md:hidden p-1.5 rounded-sm border-2 border-ink bg-ivory hover:bg-ink/5 text-ink shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-ink font-sans truncate">
              {room.name}
            </h1>
            <p className="text-xs text-ink/60 truncate font-medium">
              {room.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search conversation messages"
            className={`p-1.5 rounded-sm border-2 border-ink text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              searchOpen ? "bg-sun text-ink shadow-hard-xs" : "bg-white text-ink/70 hover:bg-ivory"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Search</span>
          </button>

          {/* Slow mode badge / toggle button */}
          {isSlowMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-xs bg-sun/30 border border-ink text-ink">
              <Clock className="w-3 h-3 text-ink" />
              <span>Slow mode: 10s</span>
            </span>
          )}

          {isOrganizer && onToggleSlowMode && (
            <button
              type="button"
              onClick={onToggleSlowMode}
              aria-label={isSlowMode ? "Disable slow mode" : "Enable slow mode (10s)"}
              className={`p-1.5 rounded-sm border-2 border-ink text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                isSlowMode ? "bg-sun text-ink shadow-hard-xs" : "bg-white text-ink/70 hover:bg-ivory"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isSlowMode ? "Slow mode on" : "Slow mode"}</span>
            </button>
          )}

          {/* Room Info Drawer button */}
          {onOpenInfo && (
            <button
              type="button"
              onClick={onOpenInfo}
              aria-label="View room details and members"
              className="p-1.5 rounded-sm border-2 border-ink bg-white text-ink/70 hover:text-ink hover:bg-ivory transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Info className="w-3.5 h-3.5 text-cobalt" />
              <span className="hidden lg:inline">Info</span>
            </button>
          )}

          {/* Blocked Users button */}
          {onOpenBlocked && (
            <button
              type="button"
              onClick={onOpenBlocked}
              aria-label="View blocked people"
              className="p-1.5 rounded-sm border-2 border-ink bg-white text-ink/70 hover:text-ink hover:bg-ivory transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <UserX className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Blocked</span>
            </button>
          )}

          {/* Rules button */}
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              aria-label="View community chat rules"
              className="p-1.5 rounded-sm border-2 border-ink bg-white text-ink/70 hover:text-ink hover:bg-ivory transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Rules</span>
            </button>
          )}

          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xs bg-sun/30 border border-ink text-ink">
            Demo
          </span>
        </div>
      </header>

      {/* 2. Honest Banner (Rule 8) */}
      <aside
        aria-label="Demo notice"
        className="px-4 py-2 bg-sun/20 border-b-2 border-ink text-ink text-xs font-semibold flex items-center gap-2 shrink-0"
      >
        <Info className="w-4 h-4 shrink-0 text-ink/70" aria-hidden="true" />
        <span className="leading-snug">
          Demo chat. Messages stay in this browser and sync only between tabs of this browser. Worldwide chat needs the backend.
        </span>
      </aside>

      {/* 3. Search Bar (if search is toggled open) */}
      {searchOpen && (
        <ChatSearchBar
          roomId={room.id}
          messages={messages}
          blockedIds={blockedIds}
          onJumpToMessage={jumpToMessage}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* 4. Pinned Message Strip (if room has a pinned message) */}
      {pinnedMessage && pinnedMessage.status !== "removed" && (
        <PinnedMessageStrip
          pinnedMessage={pinnedMessage}
          author={usersMap[pinnedMessage.authorId]}
          onJumpToMessage={jumpToMessage}
          onUnpin={onTogglePin}
          isOrganizer={isOrganizer}
        />
      )}

      {/* 5. Messages Log */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 relative"
      >
        {/* Load earlier messages button */}
        {hasEarlierMessages && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-3 py-1.5 rounded-sm bg-white border-2 border-ink text-xs font-bold text-ink hover:bg-ivory shadow-hard-xs cursor-pointer"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {displayedMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center py-12">
            <EmptyState
              title="No messages yet"
              description="Say hello to start the conversation in this room."
              className="border-dashed border-2 border-ink/30 bg-transparent"
            />
          </div>
        ) : (
          displayedMessages.map((msg, index) => {
            const author = usersMap[msg.authorId]
            const isOwn = Boolean(currentUserId && msg.authorId === currentUserId)
            const replyTarget = msg.replyToId ? messagesById.get(msg.replyToId) : null
            const isPinned = Boolean(pinnedMessage && pinnedMessage.id === msg.id)

            // Calculate day divider
            const prevMsg = displayedMessages[index - 1]
            const currentDay = getDayLabel(msg.createdAt)
            const prevDay = prevMsg ? getDayLabel(prevMsg.createdAt) : null
            const dayDivider = currentDay !== prevDay ? currentDay : null

            // Calculate grouping (within 5 minutes and same author)
            let isGrouped = false
            if (prevMsg && !dayDivider && prevMsg.authorId === msg.authorId) {
              const diffMs =
                new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
              if (diffMs < 5 * 60 * 1000) {
                isGrouped = true
              }
            }

            return (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                author={author}
                replyTarget={replyTarget}
                usersMap={usersMap}
                isOwn={isOwn}
                isGrouped={isGrouped}
                isPinned={isPinned}
                isOrganizer={isOrganizer}
                currentUserId={currentUserId}
                blockedIds={blockedIds}
                dayDivider={dayDivider}
                onReply={(m) => setReplyingTo(m)}
                onToggleReaction={onToggleReaction}
                onTogglePin={onTogglePin}
                onDelete={onDeleteMessage}
                onRemoveByOrganizer={onRemoveMessageByOrganizer}
                onReport={onReportMessage}
                onBlockUser={onBlockUser}
                onJumpToMessage={jumpToMessage}
                onSelectTask={onSelectTask}
              />
            )
          })
        )}
      </div>

      {/* Floating 'New messages' jump button */}
      {showScrollBottomButton && (
        <div className="flex justify-center -mt-10 mb-2 relative z-10">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            aria-label="Scroll to newest messages"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime border-2 border-ink text-xs font-black text-ink shadow-hard-sm hover:scale-105 transition-all cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>New messages</span>
          </button>
        </div>
      )}

      {/* 6. Composer */}
      <ChatComposer
        onSendMessage={handleSend}
        isSending={isSending}
        slowModeCountdown={slowModeCountdown}
        tasks={tasks}
        replyingToMessage={
          replyingTo
            ? {
                id: replyingTo.id,
                authorName: usersMap[replyingTo.authorId]?.display_name || "Volunteer",
                preview: replyingTo.text.slice(0, 60),
              }
            : null
        }
        onCancelReply={() => setReplyingTo(null)}
        users={Object.values(usersMap)}
      />
    </div>
  )
}
