import { Message, MessageSchema } from "../schemas/chat.schema"
import { ReactionKey, ReportReason } from "../constants/chat"
import { ChatClient, ChatEvent, NotImplementedError } from "./chat"
import { getBrowserSupabaseClient } from "../supabase/client"

export class SupabaseChatAdapter implements ChatClient {
  private fallback?: ChatClient
  private broadcastChannel: BroadcastChannel | null = null

  constructor(fallback?: ChatClient) {
    this.fallback = fallback
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("the-movement:chat:events")
      } catch {
        this.broadcastChannel = null
      }
    }
  }

  private notifyLocal(event: ChatEvent): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event)
      } catch {}
    }
  }

  async listMessages(
    roomId?: string,
    cursor?: string
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.listMessages")
    }
    const targetRoom = roomId || "everyone"
    try {
      const params = new URLSearchParams({ roomId: targetRoom })
      if (cursor) params.set("cursor", cursor)
      const res = await fetch(`/api/chat/messages?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.success && json.data) {
        const parsed = (json.data.messages || []).map((m: unknown) => MessageSchema.parse(m))
        return {
          messages: parsed,
          nextCursor: json.data.nextCursor,
        }
      }
    } catch {
      // Fall back to storage client
    }
    return this.fallback.listMessages(targetRoom, cursor)
  }

  async sendMessage(
    roomId?: string,
    text?: string,
    replyToId?: string | null,
    taskRef?: string | null,
    authorId?: string
  ): Promise<Message> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.sendMessage")
    }
    const targetRoom = roomId || "everyone"
    const messageText = text || ""
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorId ? { "x-user-id": authorId } : {}),
        },
        body: JSON.stringify({
          roomId: targetRoom,
          text: messageText,
          replyToId,
          taskRef,
          authorId,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.success && json.data) {
        const msg = MessageSchema.parse(json.data)
        this.notifyLocal({
          type: "message_created",
          roomId: targetRoom,
          message: msg,
        })
        return msg
      }
    } catch {
      // Fall back to storage client
    }
    const msg = await this.fallback.sendMessage(targetRoom, messageText, replyToId, taskRef, authorId)
    this.notifyLocal({
      type: "message_created",
      roomId: targetRoom,
      message: msg,
    })
    return msg
  }

  async deleteMessage(id?: string): Promise<void> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.deleteMessage")
    }
    if (!id) return
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (res.ok) {
        this.notifyLocal({
          type: "message_deleted",
          roomId: "everyone",
          message: { id } as Message,
        })
        return
      }
    } catch {}
    await this.fallback.deleteMessage(id)
  }

  async removeMessageByOrganizer(id?: string): Promise<void> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.removeMessageByOrganizer")
    }
    if (!id) return
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (res.ok) {
        this.notifyLocal({
          type: "message_updated",
          roomId: "everyone",
          message: { id, status: "removed" } as Message,
        })
        return
      }
    } catch {}
    await this.fallback.removeMessageByOrganizer(id)
  }

  async reportMessage(id?: string, reason?: ReportReason, note?: string): Promise<void> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.reportMessage")
    }
    if (!id || !reason) return
    try {
      const res = await fetch("/api/chat/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, reason, note }),
      })
      if (res.ok) return
    } catch {}
    await this.fallback.reportMessage(id, reason, note)
  }

  async toggleReaction(messageId?: string, key?: ReactionKey, userId?: string): Promise<Message> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.toggleReaction")
    }
    if (!messageId || !key) {
      throw new Error("Message ID and reaction key required")
    }
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ key, userId }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const updated = MessageSchema.parse(json.data)
          this.notifyLocal({
            type: "message_updated",
            roomId: updated.roomId,
            message: updated,
          })
          return updated
        }
      }
    } catch {}
    const updated = await this.fallback.toggleReaction(messageId, key, userId)
    this.notifyLocal({
      type: "message_updated",
      roomId: updated.roomId,
      message: updated,
    })
    return updated
  }

  async pinMessage(roomId?: string, messageId?: string | null): Promise<void> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.pinMessage")
    }
    const targetRoom = roomId || "everyone"
    if (messageId) {
      try {
        const res = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}/pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: true, roomId: targetRoom }),
        })
        if (res.ok) {
          this.notifyLocal({
            type: "message_pinned",
            roomId: targetRoom,
            pinnedMessageId: messageId,
          })
          return
        }
      } catch {}
    }
    await this.fallback.pinMessage(targetRoom, messageId || null)
    this.notifyLocal({
      type: "message_pinned",
      roomId: targetRoom,
      pinnedMessageId: messageId || null,
    })
  }

  async getPinnedMessage(roomId?: string): Promise<Message | null> {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.getPinnedMessage")
    }
    return this.fallback.getPinnedMessage(roomId || "everyone")
  }

  subscribe(roomId?: string, callback?: (event: ChatEvent) => void): () => void {
    if (!this.fallback) {
      throw new NotImplementedError("SupabaseChatAdapter.subscribe")
    }
    const targetRoom = roomId || "everyone"
    const handler = callback || (() => {})

    // 1. Local BroadcastChannel subscription
    let channelHandler: ((e: MessageEvent) => void) | null = null
    if (this.broadcastChannel) {
      channelHandler = (e: MessageEvent) => {
        const event = e.data as ChatEvent
        if (event && (!event.roomId || event.roomId === targetRoom)) {
          handler(event)
        }
      }
      this.broadcastChannel.addEventListener("message", channelHandler)
    }

    // 2. Supabase Realtime channel subscription
    let supabaseUnsubscribe = () => {}
    const supabase = getBrowserSupabaseClient()
    if (supabase) {
      try {
        const channel = supabase
          .channel(`room:${targetRoom}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `room_id=eq.${targetRoom}`,
            },
            (payload) => {
              if (payload.new) {
                try {
                  const newMsg = MessageSchema.parse({
                    id: payload.new.id,
                    roomId: payload.new.room_id,
                    authorId: payload.new.author_id,
                    text: payload.new.text,
                    createdAt: payload.new.created_at,
                    status: payload.new.status,
                    replyToId: payload.new.reply_to_id || null,
                    mentions: payload.new.mentions || [],
                    reactions: payload.new.reactions || {},
                    taskRef: payload.new.task_ref || null,
                    isDemo: false,
                  })
                  handler({
                    type: "message_created",
                    roomId: targetRoom,
                    message: newMsg,
                  })
                } catch {}
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "chat_messages",
              filter: `room_id=eq.${targetRoom}`,
            },
            (payload) => {
              if (payload.new) {
                try {
                  const updatedMsg = MessageSchema.parse({
                    id: payload.new.id,
                    roomId: payload.new.room_id,
                    authorId: payload.new.author_id,
                    text: payload.new.text,
                    createdAt: payload.new.created_at,
                    status: payload.new.status,
                    replyToId: payload.new.reply_to_id || null,
                    mentions: payload.new.mentions || [],
                    reactions: payload.new.reactions || {},
                    taskRef: payload.new.task_ref || null,
                    isDemo: false,
                  })
                  handler({
                    type: "message_updated",
                    roomId: targetRoom,
                    message: updatedMsg,
                  })
                } catch {}
              }
            }
          )
          .subscribe()

        supabaseUnsubscribe = () => {
          supabase.removeChannel(channel)
        }
      } catch {}
    }

    // 3. Fallback mock subscription
    const mockUnsub = this.fallback.subscribe(targetRoom, handler)

    return () => {
      if (this.broadcastChannel && channelHandler) {
        this.broadcastChannel.removeEventListener("message", channelHandler)
      }
      supabaseUnsubscribe()
      mockUnsub()
    }
  }
}
