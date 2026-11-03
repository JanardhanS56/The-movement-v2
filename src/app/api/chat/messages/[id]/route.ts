import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SEED_USERS } from "@/lib/mocks/seed-data"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    if (!messageId) return apiError("Message ID is required", 400)

    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const userId = headerUserId || caller?.id || SEED_USERS[0].id

    // Check organizer status
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

    try {
      const admin = getAdminClient()
      if (isOrganizer) {
        await admin
          .from("chat_messages")
          .update({
            status: "removed",
            text: "[Message removed by organizer]",
          })
          .eq("id", messageId)
      } else {
        await admin
          .from("chat_messages")
          .delete()
          .eq("id", messageId)
          .eq("author_id", userId)
      }
    } catch {
      // Local fallback: return success
    }

    return apiSuccess({ id: messageId, removed: true, isOrganizer })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

