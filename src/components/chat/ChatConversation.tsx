"use client"

import * as React from "react"
import { Message } from "@/lib/schemas/chat.schema"
import { User } from "@/lib/schemas/user.schema"
import { ChatRoomDefinition } from "@/lib/constants/chat"
import { ChatMessageItem } from "./ChatMessageItem"
import { ChatComposer } from "./ChatComposer"
import { getDayLabel } from "@/lib/date"
import { ArrowLeft, ArrowDown, Info } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export interface ChatConversationProps {
  room: ChatRoomDefinition
  messages: Message[]
  usersMap: Record<string, User>
  currentUserId?: string | null
  onBackToRooms?: () => void
  onSendMessage: (text: string) => Promise<void>
  isSending?: boolean
  onSelectTask?: (taskId: string) => void
}

export function ChatConversation({
  room,
  messages,
  usersMap,
  currentUserId,
  onBackToRooms,
  onSendMessage,
  isSending = false,
  onSelectTask,
}: ChatConversationProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [showScrollBottomButton, setShowScrollBottomButton] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(50)
  const isNearBottomRef = React.useRef(true)

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

  // Auto-scroll on new messages if already near bottom
  React.useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("auto")
    }
  }, [messages.length])

  // Initial scroll to bottom on room change
  React.useEffect(() => {
    scrollToBottom("auto")
  }, [room.id])

  const displayedMessages = messages.slice(-visibleCount)
  const hasEarlierMessages = messages.length > displayedMessages.length

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

        <div className="flex items-center gap-2 shrink-0">
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

      {/* 3. Messages Log */}
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
                isOwn={isOwn}
                isGrouped={isGrouped}
                dayDivider={dayDivider}
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

      {/* 4. Composer */}
      <ChatComposer
        onSendMessage={onSendMessage}
        isSending={isSending}
        users={Object.values(usersMap)}
      />
    </div>
  )
}
