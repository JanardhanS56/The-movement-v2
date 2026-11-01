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
    const targetId = params.id
    if (!targetId) return apiError("Task or Claim ID is required", 400)

    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)
    const userId = body.userId || body.claimed_by || caller?.id

    // Find the claim record: could be passed claimId or taskId
    let claimQuery = admin.from("task_claims").select("*, task:tasks(*)")
    if (body.claimId) {
      claimQuery = claimQuery.eq("id", body.claimId)
    } else {
      claimQuery = claimQuery.or(`id.eq.${targetId},task_id.eq.${targetId}`)
      if (userId) {
        claimQuery = claimQuery.eq("claimed_by", userId)
      }
    }

    const { data: claim, error: claimError } = await claimQuery.maybeSingle()

    if (claimError || !claim) {
      return apiError("Active task claim not found for this user", 404)
    }

    if (claim.status !== "in_progress") {
      return apiError(`Cannot complete claim in status '${claim.status}'`, 400)
    }

    // Update claim to pending_verification
    const now = new Date().toISOString()
    const { data: updatedClaim, error: updateError } = await admin
      .from("task_claims")
      .update({
        status: "pending_verification",
        completed_at: now,
        note: body.note || claim.note,
        proof_url: body.proof_url || claim.proof_url,
      })
      .eq("id", claim.id)
      .select()
      .single()

    if (updateError || !updatedClaim) {
      return apiError("Failed to mark task complete", 500)
    }

    // Update task status to pending_verification
    await admin
      .from("tasks")
      .update({ status: "pending_verification", updated_at: now })
      .eq("id", claim.task_id)

    // Assign 3 random peers
    const taskObj = claim.task
    const movementId =
      taskObj?.movement_id || "00000000-0000-4000-8000-000000000001"
    const taskCreator = taskObj?.created_by

    // Query eligible verifiers in movement (excluding claimant and task creator)
    const { data: eligibleMembers } = await admin
      .from("movement_members")
      .select("user_id, users!inner(id, tier)")
      .eq("movement_id", movementId)
      .neq("user_id", claim.claimed_by)

    const candidateIds = (eligibleMembers || [])
      .map((m) => m.user_id)
      .filter((id) => id !== taskCreator)

    // Shuffle candidates
    const shuffled = [...candidateIds].sort(() => 0.5 - Math.random())
    const selectedVerifiers = shuffled.slice(0, 3)

    const verificationRows = selectedVerifiers.map((verifierId) => ({
      claim_id: claim.id,
      verifier_id: verifierId,
      assigned_at: now,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    }))

    if (verificationRows.length > 0) {
      await admin
        .from("peer_verifications")
        .upsert(verificationRows, { onConflict: "claim_id,verifier_id" })
    }

    return apiSuccess({
      claim: updatedClaim,
      verifications_assigned: selectedVerifiers.length,
      assigned_verifiers: selectedVerifiers,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

