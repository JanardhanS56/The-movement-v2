import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")

    let query = admin.from("task_claims").select("*").order("claimed_at", { ascending: false })
    if (taskId) {
      query = query.eq("task_id", taskId)
    }

    const { data: claims, error } = await query
    if (error) return apiError("Failed to fetch task claims", 500)
    return apiSuccess(claims || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

