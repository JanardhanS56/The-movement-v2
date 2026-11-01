import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const taskId = params.id
    if (!taskId) return apiError("Task ID is required", 400)

    const { data: task, error } = await admin
      .from("tasks")
      .select("*, claims:task_claims(*)")
      .eq("id", taskId)
      .maybeSingle()

    if (error) return apiError("Failed to fetch task", 500)
    if (!task) return apiError("Task not found", 404)
    return apiSuccess(task)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

