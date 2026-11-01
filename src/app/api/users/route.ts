import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id") || searchParams.get("userId")

    if (userId) {
      const { data: user, error } = await admin
        .from("users")
        .select("id, display_name, avatar_url, tier, metadata, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle()

      if (error) return apiError("Failed to fetch user", 500)
      if (!user) return apiError("User not found", 404)
      return apiSuccess(user)
    }

    const { data: users, error } = await admin
      .from("users")
      .select("id, display_name, avatar_url, tier, metadata, created_at, updated_at")
      .order("created_at", { ascending: true })

    if (error) return apiError("Failed to fetch users", 500)
    return apiSuccess(users || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
