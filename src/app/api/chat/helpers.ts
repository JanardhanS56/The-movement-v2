// Rollback: delete this file if needed
import { Message, MessageStatus } from "@/lib/schemas/chat.schema"

export interface ChatMessageRow {
  id: string
  room_id: string
  author_id: string
  text: string
  status: string
  reply_to_id: string | null
  mentions: string[]
  reactions: Record<string, string[]>
  task_ref: string | null
  is_pinned?: boolean
  created_at: string
}

export function mapRowToMessage(row: ChatMessageRow): Message {
  return {
    id: row.id,
    roomId: row.room_id,
    authorId: row.author_id,
    text: row.text,
    createdAt: row.created_at,
    status: (row.status as MessageStatus) || "sent",
    replyToId: row.reply_to_id || null,
    mentions: Array.isArray(row.mentions) ? row.mentions : [],
    reactions: row.reactions && typeof row.reactions === "object" ? row.reactions : {},
    taskRef: row.task_ref || null,
    isDemo: false,
  }
}
