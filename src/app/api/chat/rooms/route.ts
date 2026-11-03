import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { CHAT_ROOMS, ChatRoomDefinition } from "@/lib/constants/chat"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const movementId = searchParams.get("movementId")

    let rooms: ChatRoomDefinition[] = []

    try {
      const admin = getAdminClient()
      let query = admin.from("chat_rooms").select("*").order("created_at", { ascending: true })
      if (movementId) {
        query = query.or(`movement_id.eq.${movementId},movement_id.is.null`)
      }

      const { data, error } = await query
      if (!error && Array.isArray(data) && data.length > 0) {
        rooms = data.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          isDemo: false,
        }))
      }
    } catch {
      // Fallback below
    }

    if (rooms.length === 0) {
      rooms = [...CHAT_ROOMS]
    }

    return apiSuccess(rooms)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

