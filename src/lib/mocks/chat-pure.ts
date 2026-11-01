import { Message } from "../schemas/chat.schema"
import { User } from "../schemas/user.schema"
import { CHAT_REACTIONS, ReactionKey } from "../constants/chat"

export interface ReactionTotal {
  key: ReactionKey
  glyph: string
  label: string
  count: number
  hasReacted: boolean
  userIds: string[]
}

/**
 * Derived unread count for a room.
 * Computes non-removed messages created after lastReadAt, excluding blocked authors.
 */
export function getUnreadCount(
  roomId: string,
  lastReadAt: string | null,
  messages: Message[],
  blockedIds: string[] = []
): number {
  if (!messages || messages.length === 0) return 0
  const blockedSet = new Set(blockedIds)
  const lastReadMillis = lastReadAt ? new Date(lastReadAt).getTime() : 0

  return messages.filter((m) => {
    if (m.roomId !== roomId) return false
    if (m.status === "removed") return false
    if (blockedSet.has(m.authorId)) return false
    const msgMillis = new Date(m.createdAt).getTime()
    return msgMillis > lastReadMillis
  }).length
}

/**
 * Derived mention count across messages for a user.
 * Computes non-removed messages mentioning userId after lastReadAt, excluding blocked authors.
 */
export function getMentionCount(
  userId: string,
  lastReadAt: string | null,
  messages: Message[],
  blockedIds: string[] = []
): number {
  if (!messages || messages.length === 0 || !userId) return 0
  const blockedSet = new Set(blockedIds)
  const lastReadMillis = lastReadAt ? new Date(lastReadAt).getTime() : 0

  return messages.filter((m) => {
    if (m.status === "removed") return false
    if (blockedSet.has(m.authorId)) return false
    if (!m.mentions || !m.mentions.includes(userId)) return false
    const msgMillis = new Date(m.createdAt).getTime()
    return msgMillis > lastReadMillis
  }).length
}

/**
 * Pure derived totals for reactions on a message.
 * Returns only keys with count > 0, sorted by highest count first.
 * If message is removed, returns empty list.
 * Excludes reactions from blocked user IDs.
 */
export function getReactionTotals(
  message: Message,
  currentUserId?: string | null,
  blockedIds: string[] = []
): ReactionTotal[] {
  if (!message || message.status === "removed" || !message.reactions) {
    return []
  }

  const blockedSet = new Set(blockedIds)
  const totals: ReactionTotal[] = []

  for (const [key, users] of Object.entries(message.reactions) as [ReactionKey, string[]][]) {
    const meta = CHAT_REACTIONS[key]
    if (!meta) continue

    const validUsers = (users || []).filter((uid) => !blockedSet.has(uid))
    if (validUsers.length > 0) {
      totals.push({
        key,
        glyph: meta.glyph,
        label: meta.label,
        count: validUsers.length,
        hasReacted: Boolean(currentUserId && validUsers.includes(currentUserId)),
        userIds: validUsers,
      })
    }
  }

  return totals.sort((a, b) => b.count - a.count)
}

/**
 * Extracts valid user UUIDs from @handle mentions in text.
 */
export function parseMentions(text: string, users: User[]): string[] {
  if (!text || !users || users.length === 0) return []

  // Match @handle where handle consists of alphanumeric, underscore, hyphen
  const matches = text.match(/@([a-zA-Z0-9_-]+)/g)
  if (!matches) return []

  const handleMap = new Map<string, string>()
  for (const user of users) {
    if (user.handle) {
      handleMap.set(user.handle.toLowerCase(), user.id)
    }
  }

  const mentionedIds = new Set<string>()
  for (const match of matches) {
    const rawHandle = match.slice(1).toLowerCase()
    const matchedId = handleMap.get(rawHandle)
    if (matchedId) {
      mentionedIds.add(matchedId)
    }
  }

  return Array.from(mentionedIds)
}

/**
 * Filters non-removed messages in a room matching a search query.
 */
export function searchMessages(
  roomId: string,
  query: string,
  messages: Message[],
  blockedIds: string[] = []
): Message[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const blockedSet = new Set(blockedIds)

  return messages.filter((m) => {
    if (m.roomId !== roomId) return false
    if (m.status === "removed") return false
    if (blockedSet.has(m.authorId)) return false
    return m.text.toLowerCase().includes(trimmed)
  })
}
