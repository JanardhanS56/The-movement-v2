import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const caller = await getCallerUser(req)
    const verifierId =
      searchParams.get("verifierId") || searchParams.get("userId") || caller?.id

    if (!verifierId) {
      return apiError("Authentication required: verifierId or user token required", 401)
    }

    const { data: pending, error } = await admin
      .from("peer_verifications")
      .select(`
        id,
        claim_id,
        verifier_id,
        vote,
        assigned_at,
        expires_at,
        claim:task_claims!inner(
          id,
          task_id,
          claimed_by,
          status,
          note,
          proof_url,
          claimed_at,
          completed_at,
          task:tasks!inner(
            id,
            title,
            description,
            reward_points,
            status
          ),
          claimant:users!task_claims_claimed_by_fkey(
            id,
            display_name,
            avatar_url,
            tier
          )
        )
      `)
      .eq("verifier_id", verifierId)
      .is("vote", null)
      .order("assigned_at", { ascending: false })

    if (error) {
      // Fallback without complex joins if foreign key names vary
      const { data: rawPending, error: rawError } = await admin
        .from("peer_verifications")
        .select("*")
        .eq("verifier_id", verifierId)
        .is("vote", null)
        .order("assigned_at", { ascending: false })

      if (rawError) return apiError("Failed to fetch pending verifications", 500)
      return apiSuccess(rawPending || [])
    }

    return apiSuccess(pending || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

