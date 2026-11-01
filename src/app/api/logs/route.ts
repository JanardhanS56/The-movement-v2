import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)

    const userId = body.user_id || body.userId || caller?.id
    const action = body.action

    if (!action || typeof action !== "string") {
      return apiError("Action string is required", 400)
    }

    const { data: log, error } = await admin
      .from("user_logs")
      .insert({
        user_id: userId || null,
        action,
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) {
      return apiError("Failed to persist log", 500)
    }

    return apiSuccess(log, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

