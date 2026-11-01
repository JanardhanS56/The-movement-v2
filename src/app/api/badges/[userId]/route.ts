import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SEED_BADGES } from "@/lib/mocks/seed-data"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = getAdminClient()
    const userId = params.userId

    if (!userId) {
      return apiError("User ID parameter is required", 400)
    }

    const { data: badges } = await admin
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })

    if (badges && badges.length > 0) {
      return apiSuccess(badges)
    }

    const seed = SEED_BADGES.filter((b) => b.user_id === userId)
    if (seed.length > 0) return apiSuccess(seed)
    return apiSuccess(SEED_BADGES.slice(0, 4).map((b) => ({ ...b, user_id: userId })))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

