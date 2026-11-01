import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const claimId = searchParams.get("claimId") || searchParams.get("claim_id")

    let query = admin.from("peer_verifications").select("*").order("assigned_at", { ascending: false })
    if (claimId) {
      query = query.eq("claim_id", claimId)
    }

    const { data: verifications, error } = await query
    if (error) return apiError("Failed to fetch peer verifications", 500)
    return apiSuccess(verifications || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
