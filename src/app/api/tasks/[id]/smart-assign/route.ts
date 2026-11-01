import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const taskId = params.id
    if (!taskId) {
      return apiError("Task ID is required", 400)
    }

    // 1. Fetch task details
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, title, required_skills, required_volunteers, status")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return apiError("Task not found", 404)
    }

    if (task.status === "completed" || task.status === "cancelled") {
      return apiError(`Cannot assign volunteers to a task that is ${task.status}`, 400)
    }

    const requiredSkills: string[] = Array.isArray(task.required_skills)
      ? task.required_skills
      : []

    if (requiredSkills.length === 0) {
      return apiError("Task has no required skills configured for Smart Assign", 400)
    }

    // 2. Check current capacity
    const { data: existingClaims, error: claimsError } = await admin
      .from("task_claims")
      .select("claimed_by, status")
      .eq("task_id", taskId)
      .in("status", ["in_progress", "pending_verification", "verified"])

    if (claimsError) {
      return apiError("Failed to check existing task claims", 500)
    }

    const currentCount = existingClaims ? existingClaims.length : 0
    const needed = (task.required_volunteers || 1) - currentCount

    if (needed <= 0) {
      return apiError("Task has already reached its maximum volunteer capacity", 400)
    }

    // 3. Supabase Postgres array overlap query directly on the database
    // Does NOT fetch all users into memory
    let query = admin
      .from("profiles")
      .select("id, username, skills_interests")
      .overlaps("skills_interests", requiredSkills)

    if (existingClaims && existingClaims.length > 0) {
      const existingIds = existingClaims.map((c) => c.claimed_by).filter(Boolean)
      if (existingIds.length > 0) {
        query = query.not("id", "in", `(${existingIds.join(",")})`)
      }
    }

    const { data: matchedProfiles, error: matchError } = await query.limit(needed)

    if (matchError) {
      return apiError(`Failed to find matching volunteers: ${matchError.message}`, 500)
    }

    if (!matchedProfiles || matchedProfiles.length === 0) {
      return apiSuccess({
        assigned_count: 0,
        message: "No matching volunteers found with the required skills.",
        claims: [],
      })
    }

    // 4. Create task_claims entries for matched profiles
    const now = new Date().toISOString()
    const claimsToInsert = matchedProfiles.map((profile) => ({
      task_id: taskId,
      claimed_by: profile.id,
      status: "in_progress",
      note: `Smart Assigned based on skills: ${requiredSkills.join(", ")}`,
      claimed_at: now,
    }))

    const { data: createdClaims, error: insertError } = await admin
      .from("task_claims")
      .insert(claimsToInsert)
      .select()

    if (insertError) {
      return apiError(`Failed to assign volunteers: ${insertError.message}`, 500)
    }

    // 5. Update task status if was open
    if (task.status === "open") {
      await admin.from("tasks").update({ status: "in_progress" }).eq("id", taskId)
    }

    // 6. Record action in user_logs
    for (const profile of matchedProfiles) {
      try {
        await admin.from("user_logs").insert({
          user_id: profile.id,
          action: "task_smart_assigned",
          timestamp: now,
          metadata: {
            task_id: taskId,
            task_title: task.title,
            matched_skills: requiredSkills,
          },
        })
      } catch {
        // Logging failure should not abort task assignment
      }
    }

    return apiSuccess({
      assigned_count: matchedProfiles.length,
      assigned_users: matchedProfiles.map((p) => p.username),
      claims: createdClaims || [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
