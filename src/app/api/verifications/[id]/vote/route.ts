import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SubmitVerificationVoteSchema } from "@/lib/schemas/verification.schema"
import { evaluateMilestoneBadges } from "@/lib/services/badges"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const targetId = params.id

    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)
    const verifierId = body.verifierId || body.userId || caller?.id

    const parsed = SubmitVerificationVoteSchema.safeParse({
      claim_id: body.claim_id || body.claimId || targetId,
      vote: body.vote,
    })

    if (!parsed.success) {
      return apiError(`Invalid vote payload: ${parsed.error.issues[0]?.message}`, 400)
    }

    const { vote } = parsed.data

    // Locate verification assignment
    let query = admin.from("peer_verifications").select("*, claim:task_claims(*, task:tasks(*))")
    if (body.verificationId) {
      query = query.eq("id", body.verificationId)
    } else {
      query = query.or(`id.eq.${targetId},claim_id.eq.${targetId}`)
      if (verifierId) {
        query = query.eq("verifier_id", verifierId)
      }
    }

    const { data: verification, error: verifError } = await query.maybeSingle()

    if (verifError || !verification) {
      return apiError("Verification assignment not found", 404)
    }

    if (verification.vote !== null) {
      return apiError("Vote has already been cast for this assignment", 400)
    }

    const now = new Date().toISOString()

    // 1. Record vote
    const { data: updatedVerification, error: voteUpdateError } = await admin
      .from("peer_verifications")
      .update({
        vote,
        voted_at: now,
      })
      .eq("id", verification.id)
      .select()
      .single()

    if (voteUpdateError || !updatedVerification) {
      return apiError("Failed to record verification vote", 500)
    }

    // 2. Count approvals and rejections for this claim
    const claimId = verification.claim_id

    const { data: allVotes } = await admin
      .from("peer_verifications")
      .select("vote")
      .eq("claim_id", claimId)

    const approvals = (allVotes || []).filter((v) => v.vote === "approve").length
    const rejections = (allVotes || []).filter((v) => v.vote === "reject").length

    let claimStatus = verification.claim?.status || "pending_verification"

    // 3. Threshold checks: 3 approvals (or 2 if 2 verifiers) = verified, 2 rejections = rejected
    const isQuorumReached = approvals >= 3 || (approvals >= 2 && (allVotes || []).length <= 2)
    if (isQuorumReached && claimStatus !== "verified") {
      claimStatus = "verified"

      // Update claim
      await admin
        .from("task_claims")
        .update({ status: "verified", verified_at: now })
        .eq("id", claimId)

      // Update parent task
      const taskId = verification.claim?.task_id
      if (taskId) {
        await admin
          .from("tasks")
          .update({ status: "completed", updated_at: now })
          .eq("id", taskId)
      }

      // Issue badge and credit points to claimant
      const claimantId = verification.claim?.claimed_by
      const taskTitle = verification.claim?.task?.title || "Community Bounty Task"
      const rewardPoints = verification.claim?.task?.reward_points || 50

      if (claimantId) {
        // Credit impact points to claimant
        try {
          const { data: userData } = await admin
            .from("users")
            .select("impact_points")
            .eq("id", claimantId)
            .maybeSingle()
          const currentPoints = (userData as { impact_points?: number })?.impact_points || 0
          await admin
            .from("users")
            .update({ impact_points: currentPoints + rewardPoints })
            .eq("id", claimantId)
        } catch {}

        // Add impact ledger audit record
        try {
          await admin.from("impact_ledger").upsert(
            {
              user_id: claimantId,
              task_id: taskId,
              claim_id: claimId,
              task_title: taskTitle,
              verification_method: "peer_vote",
              verified_by_detail: `Peer Review Consensus (${approvals} approvals)`,
              reward_points: rewardPoints,
              verified_at: now,
            },
            { onConflict: "claim_id" }
          )
        } catch {}

        // Prevent duplicate badge insertion
        const { data: existingBadge } = await admin
          .from("badges")
          .select("id")
          .eq("claim_id", claimId)
          .maybeSingle()

        if (!existingBadge) {
          await admin.from("badges").insert({
            user_id: claimantId,
            claim_id: claimId,
            badge_type: "task_complete",
            badge_label: taskTitle,
            issued_by: "peer_vote",
            metadata: {
              task_title: taskTitle,
              reward_points: rewardPoints,
              verified_at: now,
            },
            awarded_at: now,
          })
        }

        // Evaluate milestone badges (first_step, reliable_responder, community_pillar)
        await evaluateMilestoneBadges(claimantId)
      }
    } else if (rejections >= 2 && claimStatus !== "rejected") {
      claimStatus = "rejected"
      await admin.from("task_claims").update({ status: "rejected" }).eq("id", claimId)
    }

    return apiSuccess({
      verification: updatedVerification,
      claim_id: claimId,
      claim_status: claimStatus,
      approvals,
      rejections,
      verified: claimStatus === "verified",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

