import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SEED_USERS } from "@/lib/mocks/seed-data"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    if (!messageId) return apiError("Message ID is required", 400)

    const body = await req.json().catch(() => ({}))
    const pin = body.pin ?? true
    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const userId = body.userId || headerUserId || caller?.id || SEED_USERS[0].id

    // Check Tier 3 Organizer status
    let isOrganizer = caller?.tier === 3
    if (!isOrganizer) {
      try {
        const admin = getAdminClient()
        const { data: user } = await admin.from("users").select("tier").eq("id", userId).single()
        if (user?.tier === 3) isOrganizer = true
      } catch {}
    }
    if (!isOrganizer) {
      const seedUser = SEED_USERS.find((u) => u.id === userId)
      if (seedUser?.tier === 3) isOrganizer = true
    }

    if (!isOrganizer) {
      return apiError("Forbidden: Only Tier 3 Organizers can pin messages", 403)
    }

    const admin = getAdminClient()
    const { data: msg } = await admin.from("chat_messages").select("room_id").eq("id", messageId).single()
    const roomId = body.roomId || msg?.room_id || "everyone"

    if (pin) {
      await admin.from("chat_messages").update({ is_pinned: false }).eq("room_id", roomId)
      await admin.from("chat_messages").update({ is_pinned: true }).eq("id", messageId)
      await admin.from("chat_pinned_messages").upsert({
        room_id: roomId,
        message_id: messageId,
        pinned_by: userId,
        pinned_at: new Date().toISOString(),
      })
    } else {
      await admin.from("chat_messages").update({ is_pinned: false }).eq("id", messageId)
      await admin.from("chat_pinned_messages").delete().eq("room_id", roomId)
    }

    return apiSuccess({ id: messageId, roomId, pinned: pin })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

