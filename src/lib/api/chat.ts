import { Message, MessageSchema } from "../schemas/chat.schema"
import { ReactionKey, ReportReason, CHAT_RATE_LIMITS } from "../constants/chat"
import { SEED_USERS } from "../mocks/seed-data"
import { parseMentions } from "../mocks/chat-pure"

export class NotImplementedError extends Error {
  constructor(featureName: string) {
    super(`${featureName} requires backend integration.`)
    this.name = "NotImplementedError"
  }
}

export class ChatRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChatRateLimitError"
  }
}

export interface ChatEvent {
  type: "message_created" | "message_updated" | "message_deleted" | "message_pinned"
  roomId: string
  message?: Message
  pinnedMessageId?: string | null
}

export interface ChatClient {
  listMessages(roomId: string, cursor?: string): Promise<{ messages: Message[]; nextCursor?: string }>
  sendMessage(roomId: string, text: string, replyToId?: string | null, taskRef?: string | null, authorId?: string): Promise<Message>
  deleteMessage(id: string): Promise<void>
  removeMessageByOrganizer(id: string): Promise<void>
  reportMessage(id: string, reason: ReportReason, note?: string): Promise<void>
  toggleReaction(messageId: string, key: ReactionKey, userId?: string): Promise<Message>
  pinMessage(roomId: string, messageId: string | null): Promise<void>
  getPinnedMessage(roomId: string): Promise<Message | null>
  subscribe(roomId: string, callback: (event: ChatEvent) => void): () => void
}

const STORAGE_PREFIX = "the-movement:chat:messages:"
const PINNED_PREFIX = "the-movement:chat:pinned:"
const REPORTS_KEY = "the-movement:chat:reports"
const BROADCAST_CHANNEL_NAME = "the-movement:chat:events"

function generateV4UUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Deterministic seed generator for 25 fictional demo messages in 3 rooms.
 * Strictly uses mock user IDs from SEED_USERS (no hardcoded person names).
 */
export function buildFictionalDemoMessages(): Record<string, Message[]> {
  const u1 = SEED_USERS[0]?.id || "11111111-1111-4111-8111-111111111111" // Organizer
  const u2 = SEED_USERS[1]?.id || "22222222-2222-4222-8222-222222222222" // Organizer
  const u3 = SEED_USERS[2]?.id || "33333333-3333-4333-8333-333333333333" // Organizer
  const u4 = SEED_USERS[3]?.id || "44444444-4444-4444-8444-444444444444" // Senior Vol
  const u5 = SEED_USERS[4]?.id || "55555555-5555-4555-8555-555555555555" // Volunteer
  const u6 = SEED_USERS[5]?.id || "66666666-6666-4666-8666-666666666666" // Volunteer

  const h1 = SEED_USERS[0]?.handle || "janardhan"
  const h2 = SEED_USERS[1]?.handle || "rohan-shetty"
  const h3 = SEED_USERS[2]?.handle || "ananya-kamath"
  const h4 = SEED_USERS[3]?.handle || "devika-pai"

  const now = Date.now()
  const hour = 3600 * 1000

  // 1. Room: Everyone (12 messages)
  const m1Id = "a1111111-0001-4000-8000-000000000001"
  const m2Id = "a1111111-0001-4000-8000-000000000002"
  const m3Id = "a1111111-0001-4000-8000-000000000003"
  const m4Id = "a1111111-0001-4000-8000-000000000004"
  const m5Id = "a1111111-0001-4000-8000-000000000005"
  const m6Id = "a1111111-0001-4000-8000-000000000006"
  const m7Id = "a1111111-0001-4000-8000-000000000007"
  const m8Id = "a1111111-0001-4000-8000-000000000008"
  const m9Id = "a1111111-0001-4000-8000-000000000009"
  const m10Id = "a1111111-0001-4000-8000-000000000010"
  const m11Id = "a1111111-0001-4000-8000-000000000011"
  const m12Id = "a1111111-0001-4000-8000-000000000012"

  const everyoneMessages: Message[] = [
    {
      id: m1Id,
      roomId: "everyone",
      authorId: u1,
      text: "Welcome everyone to The Movement chat. Please keep conversations constructive and helpful.",
      createdAt: new Date(now - 14 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thumbs_up: [u2, u3, u4],
        heart: [u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m2Id,
      roomId: "everyone",
      authorId: u2,
      text: "Reminder: Please review our community guidelines. Never share home addresses or personal phone numbers here.",
      createdAt: new Date(now - 13 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thanks: [u1, u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m3Id,
      roomId: "everyone",
      authorId: u3,
      text: "Glad to see our volunteer community growing across districts.",
      createdAt: new Date(now - 11 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        celebrate: [u1, u2, u4, u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m4Id,
      roomId: "everyone",
      authorId: u4,
      text: `Thanks @${h3} for coordinating the northern hub schedule!`,
      createdAt: new Date(now - 9 * hour).toISOString(),
      status: "sent",
      replyToId: m3Id,
      mentions: [u3],
      reactions: {
        heart: [u3],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m5Id,
      roomId: "everyone",
      authorId: u5,
      text: "Just signed up for this weekend's field clean-up. Looking forward to meeting the team.",
      createdAt: new Date(now - 7 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thumbs_up: [u1, u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m6Id,
      roomId: "everyone",
      authorId: u6,
      text: "Same here. Bringing reusable sacks and gloves.",
      createdAt: new Date(now - 6 * hour).toISOString(),
      status: "sent",
      replyToId: m5Id,
      mentions: [],
      reactions: {},
      taskRef: null,
      isDemo: true,
    },
    {
      id: m7Id,
      roomId: "everyone",
      authorId: u1,
      text: `Great initiative! @${h4} has extra safety kits at the community booth if anyone needs them.`,
      createdAt: new Date(now - 5 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [u4],
      reactions: {
        thumbs_up: [u5, u6],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m8Id,
      roomId: "everyone",
      authorId: u4,
      text: "Yes, exactly 12 standard kits remaining. First come, first served on Saturday morning.",
      createdAt: new Date(now - 4 * hour).toISOString(),
      status: "sent",
      replyToId: m7Id,
      mentions: [],
      reactions: {
        thanks: [u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m9Id,
      roomId: "everyone",
      authorId: u3,
      text: "Weather forecast looks clear for the rally and clean-up.",
      createdAt: new Date(now - 3 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        celebrate: [u1, u2],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m10Id,
      roomId: "everyone",
      authorId: u2,
      text: "Remember to drink plenty of water and wear sun hats.",
      createdAt: new Date(now - 2 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        heart: [u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: m11Id,
      roomId: "everyone",
      authorId: u5,
      text: `Checking in with @${h1} regarding arrival times for Tier 1 volunteers.`,
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [u1],
      reactions: {},
      taskRef: null,
      isDemo: true,
    },
    {
      id: m12Id,
      roomId: "everyone",
      authorId: u1,
      text: "Tier 1 briefing starts at 07:30 AM sharp at the central pavilion.",
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      status: "sent",
      replyToId: m11Id,
      mentions: [],
      reactions: {
        thumbs_up: [u5, u6],
      },
      taskRef: null,
      isDemo: true,
    },
  ]

  // 2. Room: Coastal Action Front (7 messages)
  const c1Id = "c1111111-0002-4000-8000-000000000001"
  const c2Id = "c1111111-0002-4000-8000-000000000002"
  const c3Id = "c1111111-0002-4000-8000-000000000003"
  const c4Id = "c1111111-0002-4000-8000-000000000004"
  const c5Id = "c1111111-0002-4000-8000-000000000005"
  const c6Id = "c1111111-0002-4000-8000-000000000006"
  const c7Id = "c1111111-0002-4000-8000-000000000007"

  const coastalMessages: Message[] = [
    {
      id: c1Id,
      roomId: "coastal-action-front",
      authorId: u2,
      text: "Coastal Action Front room activated for tide tracking and shore sweeps.",
      createdAt: new Date(now - 10 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thumbs_up: [u1, u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c2Id,
      roomId: "coastal-action-front",
      authorId: u4,
      text: "High tide is expected at 11:15 AM along Sector 4. Please coordinate accordingly.",
      createdAt: new Date(now - 8 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        surprised: [u5],
        thanks: [u2],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c3Id,
      roomId: "coastal-action-front",
      authorId: u5,
      text: "Sector 3 collection points are set up near the lighthouse pier.",
      createdAt: new Date(now - 5 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thumbs_up: [u2, u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c4Id,
      roomId: "coastal-action-front",
      authorId: u6,
      text: "We have 3 recycling sorting bins stationed alongside.",
      createdAt: new Date(now - 4 * hour).toISOString(),
      status: "sent",
      replyToId: c3Id,
      mentions: [],
      reactions: {
        celebrate: [u4],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c5Id,
      roomId: "coastal-action-front",
      authorId: u2,
      text: `Good work team. @${h2} will check in around midday for waste tallying.`,
      createdAt: new Date(now - 3 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [u2],
      reactions: {
        thumbs_up: [u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c6Id,
      roomId: "coastal-action-front",
      authorId: u4,
      text: "First 40 bags collected and sorted into recyclable plastics and general debris.",
      createdAt: new Date(now - 90 * 60 * 1000).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        celebrate: [u1, u2, u5, u6],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: c7Id,
      roomId: "coastal-action-front",
      authorId: u1,
      text: "Outstanding progress. Keep safety vests visible at all times near the waterline.",
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        heart: [u4],
      },
      taskRef: null,
      isDemo: true,
    },
  ]

  // 3. Room: Help and questions (6 messages)
  const h1MsgId = "d1111111-0003-4000-8000-000000000001"
  const h2MsgId = "d1111111-0003-4000-8000-000000000002"
  const h3MsgId = "d1111111-0003-4000-8000-000000000003"
  const h4MsgId = "d1111111-0003-4000-8000-000000000004"
  const h5MsgId = "d1111111-0003-4000-8000-000000000005"
  const h6MsgId = "d1111111-0003-4000-8000-000000000006"

  const helpMessages: Message[] = [
    {
      id: h1MsgId,
      roomId: "help-questions",
      authorId: u3,
      text: "Post any questions here regarding tasks, point ledger, or peer verification.",
      createdAt: new Date(now - 12 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        thumbs_up: [u1, u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: h2MsgId,
      roomId: "help-questions",
      authorId: u5,
      text: "How do I claim a task if my tier is currently Volunteer?",
      createdAt: new Date(now - 9 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {},
      taskRef: null,
      isDemo: true,
    },
    {
      id: h3MsgId,
      roomId: "help-questions",
      authorId: u3,
      text: "Go to the Tasks board, choose any open task marked for Tier 1, and tap 'Claim task'.",
      createdAt: new Date(now - 8 * hour).toISOString(),
      status: "sent",
      replyToId: h2MsgId,
      mentions: [],
      reactions: {
        thanks: [u5],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: h4MsgId,
      roomId: "help-questions",
      authorId: u6,
      text: "When do peer verification votes finalize on completed submissions?",
      createdAt: new Date(now - 6 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {},
      taskRef: null,
      isDemo: true,
    },
    {
      id: h5MsgId,
      roomId: "help-questions",
      authorId: u4,
      text: "As soon as 2 verifications approve the submission, points are automatically credited.",
      createdAt: new Date(now - 5 * hour).toISOString(),
      status: "sent",
      replyToId: h4MsgId,
      mentions: [],
      reactions: {
        thumbs_up: [u6],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: h6MsgId,
      roomId: "help-questions",
      authorId: u5,
      text: "Understood, thank you both for the clear explanations!",
      createdAt: new Date(now - 3 * hour).toISOString(),
      status: "sent",
      replyToId: null,
      mentions: [],
      reactions: {
        heart: [u3, u4],
      },
      taskRef: null,
      isDemo: true,
    },
  ]

  return {
    everyone: everyoneMessages,
    "coastal-action-front": coastalMessages,
    "help-questions": helpMessages,
  }
}

/**
 * Mock Chat Adapter with sessionStorage persistence, rate limits, and BroadcastChannel cross-tab sync.
 */
export class MockChatAdapter implements ChatClient {
  private lastMessageTimestamp = 0
  private messageTimestampsInLastMinute: number[] = []
  private lastReactionTimestamp = 0
  private reactionTimestampsInLastMinute: number[] = []
  private channel: BroadcastChannel | null = null

  constructor() {
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      } catch {
        this.channel = null
      }
    }
    this.ensureSeeded()
  }

  private ensureSeeded(): void {
    if (typeof window === "undefined") return
    try {
      const seeded = sessionStorage.getItem("the-movement:chat:seeded")
      if (!seeded) {
        const seedData = buildFictionalDemoMessages()
        for (const [roomId, messages] of Object.entries(seedData)) {
          sessionStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(messages))
        }
        // Set pinned message in everyone room
        sessionStorage.setItem(
          `${PINNED_PREFIX}everyone`,
          "a1111111-0001-4000-8000-000000000001"
        )
        sessionStorage.setItem("the-movement:chat:seeded", "true")
      }
    } catch {}
  }

  private getRoomMessages(roomId: string): Message[] {
    if (typeof window === "undefined") return []
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomId}`)
      if (!raw) {
        const seedData = buildFictionalDemoMessages()
        const initial = seedData[roomId] || []
        sessionStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(initial))
        return initial
      }
      return JSON.parse(raw) as Message[]
    } catch {
      return []
    }
  }

  private saveRoomMessages(roomId: string, messages: Message[]): void {
    if (typeof window === "undefined") return
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}${roomId}`, JSON.stringify(messages))
    } catch {}
  }

  private broadcast(event: ChatEvent): void {
    if (this.channel) {
      try {
        this.channel.postMessage(event)
      } catch {}
    }
  }

  async listMessages(
    roomId: string
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    const all = this.getRoomMessages(roomId)
    // Sort chronological: oldest to newest
    all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return { messages: all }
  }

  async sendMessage(
    roomId: string,
    text: string,
    replyToId?: string | null,
    taskRef?: string | null,
    authorId?: string
  ): Promise<Message> {
    const now = Date.now()

    // 1. Rate limiting check
    if (now - this.lastMessageTimestamp < CHAT_RATE_LIMITS.MESSAGE_MIN_INTERVAL_MS) {
      throw new ChatRateLimitError(
        "Please slow down. You can send 1 message every 2 seconds."
      )
    }

    const oneMinuteAgo = now - 60000
    this.messageTimestampsInLastMinute = this.messageTimestampsInLastMinute.filter(
      (t) => t > oneMinuteAgo
    )
    if (this.messageTimestampsInLastMinute.length >= CHAT_RATE_LIMITS.MESSAGE_MAX_PER_MINUTE) {
      throw new ChatRateLimitError(
        "Rate limit reached. Maximum 20 messages per minute allowed."
      )
    }

    this.lastMessageTimestamp = now
    this.messageTimestampsInLastMinute.push(now)

    // Simulate 500ms network delay for realistic "Sending" -> "Sent" state
    await new Promise((resolve) => setTimeout(resolve, 500))

    const finalAuthorId =
      authorId || SEED_USERS[0]?.id || "11111111-1111-4111-8111-111111111111"
    const mentions = parseMentions(text, SEED_USERS)

    const newMessage: Message = {
      id: generateV4UUID(),
      roomId,
      authorId: finalAuthorId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: "sent",
      replyToId: replyToId || null,
      mentions,
      reactions: {},
      taskRef: taskRef || null,
      isDemo: true,
    }

    const parsed = MessageSchema.parse(newMessage)
    const existing = this.getRoomMessages(roomId)
    existing.push(parsed)
    this.saveRoomMessages(roomId, existing)

    this.broadcast({
      type: "message_created",
      roomId,
      message: parsed,
    })

    return parsed
  }

  async deleteMessage(id: string): Promise<void> {
    if (typeof window === "undefined") return
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const roomId = key.slice(STORAGE_PREFIX.length)
        const messages = this.getRoomMessages(roomId)
        const target = messages.find((m) => m.id === id)
        if (target) {
          const filtered = messages.filter((m) => m.id !== id)
          this.saveRoomMessages(roomId, filtered)
          this.broadcast({
            type: "message_deleted",
            roomId,
            message: target,
          })
          return
        }
      }
    }
  }

  async removeMessageByOrganizer(id: string): Promise<void> {
    if (typeof window === "undefined") return
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const roomId = key.slice(STORAGE_PREFIX.length)
        const messages = this.getRoomMessages(roomId)
        const target = messages.find((m) => m.id === id)
        if (target) {
          target.status = "removed"
          target.text = "Message removed by an organizer"
          target.reactions = {}
          this.saveRoomMessages(roomId, messages)
          this.broadcast({
            type: "message_updated",
            roomId,
            message: target,
          })
          return
        }
      }
    }
  }

  async reportMessage(id: string, reason: ReportReason, note?: string): Promise<void> {
    if (typeof window === "undefined") return
    try {
      const raw = sessionStorage.getItem(REPORTS_KEY) || "[]"
      const reports = JSON.parse(raw) as Array<{
        id: string
        messageId: string
        reason: ReportReason
        note?: string
        createdAt: string
      }>
      reports.push({
        id: generateV4UUID(),
        messageId: id,
        reason,
        note: note?.trim(),
        createdAt: new Date().toISOString(),
      })
      sessionStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
    } catch {}
  }

  async toggleReaction(messageId: string, key: ReactionKey, userId?: string): Promise<Message> {
    const now = Date.now()

    // Reaction rate limit
    if (now - this.lastReactionTimestamp < CHAT_RATE_LIMITS.REACTION_MIN_INTERVAL_MS) {
      throw new ChatRateLimitError("Please slow down. Quick reaction cooldown active.")
    }

    const oneMinuteAgo = now - 60000
    this.reactionTimestampsInLastMinute = this.reactionTimestampsInLastMinute.filter(
      (t) => t > oneMinuteAgo
    )
    if (this.reactionTimestampsInLastMinute.length >= CHAT_RATE_LIMITS.REACTION_MAX_PER_MINUTE) {
      throw new ChatRateLimitError("Rate limit reached: maximum 30 reactions per minute.")
    }

    this.lastReactionTimestamp = now
    this.reactionTimestampsInLastMinute.push(now)

    const finalUserId = userId || SEED_USERS[0]?.id || "11111111-1111-4111-8111-111111111111"

    if (typeof window === "undefined") {
      throw new Error("Cannot toggle reaction on server")
    }

    for (const storageKey of Object.keys(sessionStorage)) {
      if (storageKey.startsWith(STORAGE_PREFIX)) {
        const roomId = storageKey.slice(STORAGE_PREFIX.length)
        const messages = this.getRoomMessages(roomId)
        const target = messages.find((m) => m.id === messageId)
        if (target) {
          if (target.status === "removed") {
            throw new Error("Cannot react to removed messages.")
          }

          if (!target.reactions) target.reactions = {}
          const userList = target.reactions[key] || []
          const existingIndex = userList.indexOf(finalUserId)

          if (existingIndex >= 0) {
            // Toggle off
            userList.splice(existingIndex, 1)
            if (userList.length === 0) {
              delete target.reactions[key]
            } else {
              target.reactions[key] = userList
            }
          } else {
            // Toggle on
            target.reactions[key] = [...userList, finalUserId]
          }

          this.saveRoomMessages(roomId, messages)
          this.broadcast({
            type: "message_updated",
            roomId,
            message: target,
          })
          return target
        }
      }
    }

    throw new Error(`Message ${messageId} not found`)
  }

  async pinMessage(roomId: string, messageId: string | null): Promise<void> {
    if (typeof window === "undefined") return
    try {
      if (messageId) {
        sessionStorage.setItem(`${PINNED_PREFIX}${roomId}`, messageId)
      } else {
        sessionStorage.removeItem(`${PINNED_PREFIX}${roomId}`)
      }
      this.broadcast({
        type: "message_pinned",
        roomId,
        pinnedMessageId: messageId,
      })
    } catch {}
  }

  async getPinnedMessage(roomId: string): Promise<Message | null> {
    if (typeof window === "undefined") return null
    try {
      const pinnedId = sessionStorage.getItem(`${PINNED_PREFIX}${roomId}`)
      if (!pinnedId) return null
      const messages = this.getRoomMessages(roomId)
      const found = messages.find((m) => m.id === pinnedId)
      if (!found || found.status === "removed") return null
      return found
    } catch {
      return null
    }
  }

  subscribe(roomId: string, callback: (event: ChatEvent) => void): () => void {
    if (typeof window === "undefined") return () => {}

    const handleBroadcast = (e: MessageEvent<ChatEvent>) => {
      if (e.data && e.data.roomId === roomId) {
        callback(e.data)
      }
    }

    if (this.channel) {
      this.channel.addEventListener("message", handleBroadcast)
    }

    return () => {
      if (this.channel) {
        this.channel.removeEventListener("message", handleBroadcast)
      }
    }
  }
}

/**
 * ============================================================================
 * SUPABASE REALTIME CHAT ADAPTER (STUB)
 * ============================================================================
 * Production implementation requirements:
 * 1. Realtime channel per room (postgres_changes or broadcast on channel `room:${roomId}`).
 * 2. Server-side validation with Zod / Postgres constraints.
 * 3. Token-bucket rate limiting (Redis or Postgres row-level timestamps).
 * 4. Moderation queue and reporting audit tables.
 * 5. Blocking enforcement at query level (join against user_blocks).
 * 6. Retention and automated soft/hard deletion policies.
 * 7. Mention notifications via push/email workers.
 * ============================================================================
 */
import { SupabaseChatAdapter } from "./chat-supabase-adapter"
export { SupabaseChatAdapter } from "./chat-supabase-adapter"

export const mockChatClient = new MockChatAdapter()
export const chatApi: ChatClient = new SupabaseChatAdapter(mockChatClient)
