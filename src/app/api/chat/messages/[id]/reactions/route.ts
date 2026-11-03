import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { ALLOWED_REACTION_KEYS, ReactionKey } from "@/lib/constants/chat"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { mapRowToMessage } from "../../route"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    if (!messageId) return apiError("Message ID is required", 400)

    const body = await req.json().catch(() => ({}))
    const key = body.key as ReactionKey

    if (!key || !(ALLOWED_REACTION_KEYS as readonly string[]).includes(key)) {
      return apiError(`Invalid reaction key "${key}"`, 400)
    }

    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const userId = body.userId || headerUserId || caller?.id || SEED_USERS[0].id

    const admin = getAdminClient()
    const { data: row, error } = await admin
      .from("chat_messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (error || !row) {
      return apiError("Message not found", 404)
    }

    const reactions = (row.reactions && typeof row.reactions === "object" ? { ...row.reactions } : {}) as Record<string, string[]>
    const currentList: string[] = Array.isArray(reactions[key]) ? [...reactions[key]] : []

    const index = currentList.indexOf(userId)
    if (index >= 0) {
      currentList.splice(index, 1)
    } else {
      currentList.push(userId)
    }

    if (currentList.length > 0) {
      reactions[key] = currentList
    } else {
      delete reactions[key]
    }

    const { data: updated, error: updateError } = await admin
      .from("chat_messages")
      .update({ reactions })
      .eq("id", messageId)
      .select()
      .single()

    if (updateError || !updated) {
      return apiError("Failed to update reactions", 500)
    }

    return apiSuccess(mapRowToMessage(updated))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

