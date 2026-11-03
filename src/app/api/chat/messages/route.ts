import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { Message } from "@/lib/schemas/chat.schema"
import { buildFictionalDemoMessages } from "@/lib/api/chat"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { parseMentions } from "@/lib/mocks/chat-pure"
import { mapRowToMessage, ChatMessageRow } from "@/app/api/chat/helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get("roomId") || "everyone"
    const cursor = searchParams.get("cursor")
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100)

    let messages: Message[] = []
    let nextCursor: string | undefined = undefined

    try {
      const admin = getAdminClient()
      let query = admin
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(limit + 1)

      if (cursor) {
        query = query.lt("created_at", cursor)
      }

      const { data, error } = await query

      if (!error && Array.isArray(data) && data.length > 0) {
        const rows = data as ChatMessageRow[]
        if (rows.length > limit) {
          const nextItem = rows[limit]
          nextCursor = nextItem.created_at
          messages = rows.slice(0, limit).map(mapRowToMessage).reverse()
        } else {
          messages = rows.map(mapRowToMessage).reverse()
        }
      }
    } catch {
      // Handled via fallback below
    }

    // Fail-safe in-memory fallback
    if (messages.length === 0) {
      const demoMap = buildFictionalDemoMessages()
      const roomDemo = demoMap[roomId] || []
      messages = [...roomDemo]
    }

    return apiSuccess({
      messages,
      nextCursor,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const roomId = (body.roomId || "everyone").trim()
    const text = (body.text || "").trim()
    const replyToId = body.replyToId || null
    const taskRef = body.taskRef || null

    if (!text || text.length === 0) {
      return apiError("Message text cannot be empty", 400)
    }
    if (text.length > 500) {
      return apiError("Message exceeds 500 characters", 400)
    }

    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const authorId = body.authorId || headerUserId || caller?.id || SEED_USERS[0].id

    const mentions = parseMentions(text, SEED_USERS)
    const now = new Date().toISOString()

    let createdMessage: Message | null = null

    try {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from("chat_messages")
        .insert({
          room_id: roomId,
          author_id: authorId,
          text,
          status: "sent",
          reply_to_id: replyToId,
          mentions,
          reactions: {},
          task_ref: taskRef,
          created_at: now,
        })
        .select()
        .single()

      if (!error && data) {
        createdMessage = mapRowToMessage(data as ChatMessageRow)
      }
    } catch {
      // Handled via local fallback below
    }

    if (!createdMessage) {
      createdMessage = {
        id: crypto.randomUUID(),
        roomId,
        authorId,
        text,
        createdAt: now,
        status: "sent",
        replyToId,
        mentions,
        reactions: {},
        taskRef,
        isDemo: true,
      }
    }

    return apiSuccess(createdMessage, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

