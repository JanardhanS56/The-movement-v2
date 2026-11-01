import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

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

    const { data: badges, error } = await admin
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })

    if (error) {
      return apiError("Failed to fetch user badges", 500)
    }

    return apiSuccess(badges || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

