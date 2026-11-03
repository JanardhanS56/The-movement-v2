import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { ReportReasonSchema } from "@/lib/schemas/chat.schema"
import { SEED_USERS } from "@/lib/mocks/seed-data"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { messageId, reason, note } = body

    if (!messageId) {
      return apiError("Message ID is required", 400)
    }

    const parsedReason = ReportReasonSchema.safeParse(reason)
    if (!parsedReason.success) {
      return apiError("Invalid report reason", 400)
    }

    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const reporterId = body.reporterId || headerUserId || caller?.id || SEED_USERS[0].id

    try {
      const admin = getAdminClient()
      await admin.from("chat_reports").insert({
        message_id: messageId,
        reporter_id: reporterId,
        reason: parsedReason.data,
        note: note ? String(note).slice(0, 500) : null,
      })
    } catch {
      // Local fallback
    }

    return apiSuccess({ reported: true, messageId }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

