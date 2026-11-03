import { getAdminClient } from "@/lib/supabase/admin"

export interface MilestoneBadgeAward {
  badgeType: "first_step" | "reliable_responder" | "community_pillar"
  badgeLabel: string
  milestone: string
}

export const MILESTONES: Record<string, { label: string; minTasks?: number; minPoints?: number }> = {
  first_step: {
    label: "First Step",
    minTasks: 1,
  },
  reliable_responder: {
    label: "Reliable Responder",
    minTasks: 5,
  },
  community_pillar: {
    label: "Community Pillar",
    minPoints: 500,
  },
}

/**
 * Checks whether user qualifies for milestone badges and idempotently awards them.
 */
export async function evaluateMilestoneBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = []

  try {
    const admin = getAdminClient()

    // 1. Count verified task claims
    const { count: verifiedCount } = await admin
      .from("task_claims")
      .select("id", { count: "exact", head: true })
      .eq("claimed_by", userId)
      .eq("status", "verified")

    const totalVerified = verifiedCount || 0

    // 2. Query user impact points
    const { data: userRow } = await admin
      .from("users")
      .select("impact_points")
      .eq("id", userId)
      .maybeSingle()

    const impactPoints = (userRow as { impact_points?: number })?.impact_points || 0

    // 3. Query existing milestone badges
    const { data: existingBadges } = await admin
      .from("badges")
      .select("badge_type")
      .eq("user_id", userId)
      .is("claim_id", null)

    const existingTypes = new Set((existingBadges || []).map((b) => b.badge_type))

    const now = new Date().toISOString()

    // Check Milestone 1: first_step (>= 1 verified task)
    if (totalVerified >= 1 && !existingTypes.has("first_step")) {
      await admin.from("badges").insert({
        user_id: userId,
        claim_id: null,
        badge_type: "first_step",
        badge_label: "First Step",
        issued_by: "system",
        metadata: { milestone: "1_verified_task", tasks_completed: totalVerified },
        awarded_at: now,
      })
      awardedBadges.push("first_step")
    }

    // Check Milestone 2: reliable_responder (>= 5 verified tasks)
    if (totalVerified >= 5 && !existingTypes.has("reliable_responder")) {
      await admin.from("badges").insert({
        user_id: userId,
        claim_id: null,
        badge_type: "reliable_responder",
        badge_label: "Reliable Responder",
        issued_by: "system",
        metadata: { milestone: "5_verified_tasks", tasks_completed: totalVerified },
        awarded_at: now,
      })
      awardedBadges.push("reliable_responder")
    }

    // Check Milestone 3: community_pillar (>= 500 impact points)
    if (impactPoints >= 500 && !existingTypes.has("community_pillar")) {
      await admin.from("badges").insert({
        user_id: userId,
        claim_id: null,
        badge_type: "community_pillar",
        badge_label: "Community Pillar",
        issued_by: "system",
        metadata: { milestone: "500_impact_points", impact_points: impactPoints },
        awarded_at: now,
      })
      awardedBadges.push("community_pillar")
    }
  } catch {
    // Fail-safe fallback: don't fail caller if badge evaluation encounters an issue
  }

  return awardedBadges
}
