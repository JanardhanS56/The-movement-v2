import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { OrganizerOverrideSchema } from "@/lib/schemas/verification.schema"
import { createGroundTruthCommit } from "@/lib/services/ground-truth"
import { evaluateMilestoneBadges } from "@/lib/services/badges"

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
    const organizerId = body.organizerId || body.userId || caller?.id

    if (!organizerId) {
      return apiError("Authentication required: organizerId or user token required", 401)
    }

    // 1. Verify caller is Tier 3 Organizer
    const { data: user, error: userError } = await admin
      .from("users")
      .select("tier")
      .eq("id", organizerId)
      .single()

    if (userError || !user) {
      return apiError("Organizer profile not found", 404)
    }

    if (user.tier !== 3) {
      return apiError("Forbidden: Only Tier 3 Organizers can execute verification override", 403)
    }

    // 2. Validate input
    const parsed = OrganizerOverrideSchema.safeParse({
      claim_id: body.claim_id || body.claimId || targetId,
      approve: body.approve ?? true,
      note: body.note,
    })

    if (!parsed.success) {
      return apiError(`Invalid override payload: ${parsed.error.issues[0]?.message}`, 400)
    }

    const { claim_id, approve, note } = parsed.data

    // 3. Find the claim
    const { data: claim, error: claimError } = await admin
      .from("task_claims")
      .select("*, task:tasks(*)")
      .or(`id.eq.${claim_id},task_id.eq.${claim_id}`)
      .order("claimed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (claimError || !claim) {
      return apiError("Task claim not found for override", 404)
    }

    const now = new Date().toISOString()
    const taskTitle = claim.task?.title || "Community Bounty Task"
    const rewardPoints = claim.task?.reward_points || 50

    if (approve) {
      // Mark claim verified
      await admin
        .from("task_claims")
        .update({
          status: "verified",
          verified_at: now,
          note: note ? `${claim.note || ""}\n[Organizer Note]: ${note}`.trim() : claim.note,
        })
        .eq("id", claim.id)

      // Mark task completed
      if (claim.task_id) {
        await admin
          .from("tasks")
          .update({ status: "completed", updated_at: now })
          .eq("id", claim.task_id)
      }

      // Check for existing badge
      const { data: existingBadge } = await admin
        .from("badges")
        .select("id")
        .eq("claim_id", claim.id)
        .maybeSingle()

      if (!existingBadge) {
        await admin.from("badges").insert({
          user_id: claim.claimed_by,
          claim_id: claim.id,
          badge_type: "organizer_verified",
          badge_label: taskTitle,
          issued_by: "organizer_override",
          issued_by_user: organizerId,
          metadata: {
            task_title: taskTitle,
            reward_points: rewardPoints,
            organizer_note: note || null,
            overridden_by: organizerId,
          },
          awarded_at: now,
        })
      }

      // Evaluate milestone badges
      await evaluateMilestoneBadges(claim.claimed_by).catch(() => {})

      // Automatically emit a Ground Truth audit commit
      await createGroundTruthCommit({
        eventType: "task_completed",
        title: `Task Verified: ${taskTitle}`,
        summary: `Task "${taskTitle}" claimed by volunteer was reviewed and verified by organizer.`,
        details: note || `Organizer override executed for claim ${claim.id}. Points awarded: ${rewardPoints}.`,
        authorId: organizerId,
        tags: ["Task", "Verified", "Organizer Override"],
        metadata: {
          taskId: claim.task_id,
          claimId: claim.id,
          claimantId: claim.claimed_by,
          rewardPoints,
          organizerNote: note || null,
          verificationType: "Organizer Verification",
        },
      }).catch(() => {})

      return apiSuccess({
        claim_id: claim.id,
        status: "verified",
        approved: true,
        issued_by: "organizer_override",
        issued_by_user: organizerId,
      })
    } else {
      // Rejection override
      await admin
        .from("task_claims")
        .update({ status: "rejected" })
        .eq("id", claim.id)

      return apiSuccess({
        claim_id: claim.id,
        status: "rejected",
        approved: false,
        issued_by: "organizer_override",
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

