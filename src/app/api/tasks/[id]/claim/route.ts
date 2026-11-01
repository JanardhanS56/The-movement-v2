import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const taskId = params.id
    if (!taskId) return apiError("Task ID is required", 400)

    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)
    const userId = body.claimed_by || body.userId || caller?.id

    if (!userId) {
      return apiError("Authentication required: userId or token required", 401)
    }

    // Verify task exists
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return apiError("Task not found", 404)
    }

    if (task.status === "completed" || task.status === "cancelled") {
      return apiError(`Cannot claim a task that is ${task.status}`, 400)
    }

    // Check if user already claimed this task
    const { data: existingClaim } = await admin
      .from("task_claims")
      .select("id, status")
      .eq("task_id", taskId)
      .eq("claimed_by", userId)
      .maybeSingle()

    if (existingClaim) {
      return apiError("Conflict: You have already claimed this task", 409)
    }

    // Check capacity
    const { count: activeClaimsCount } = await admin
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .eq("task_id", taskId)
      .in("status", ["in_progress", "pending_verification", "verified"])

    if ((activeClaimsCount || 0) >= task.required_volunteers) {
      return apiError("Task has already reached its maximum volunteer capacity", 400)
    }

    // Insert task claim
    const { data: claim, error: claimError } = await admin
      .from("task_claims")
      .insert({
        task_id: taskId,
        claimed_by: userId,
        status: "in_progress",
        note: body.note || null,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (claimError || !claim) {
      return apiError("Failed to claim task", 500)
    }

    // Update task status if was open
    if (task.status === "open") {
      await admin.from("tasks").update({ status: "in_progress" }).eq("id", taskId)
    }

    return apiSuccess(claim, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
