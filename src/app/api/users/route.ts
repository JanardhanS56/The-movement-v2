import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SEED_USERS } from "@/lib/mocks/seed-data"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id") || searchParams.get("userId")

    if (userId) {
      const { data: user } = await admin
        .from("users")
        .select("id, display_name, avatar_url, tier, metadata, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle()

      if (user) return apiSuccess(user)

      const seedUser = SEED_USERS.find((u) => u.id === userId || u.handle === userId)
      if (seedUser) return apiSuccess(seedUser)

      return apiError("User not found", 404)
    }

    const { data: users } = await admin
      .from("users")
      .select("id, display_name, avatar_url, tier, metadata, created_at, updated_at")
      .order("created_at", { ascending: true })

    const remoteUsers = users || []
    const remoteIds = new Set(remoteUsers.map((u) => u.id))
    const missingSeed = SEED_USERS.filter((u) => !remoteIds.has(u.id))

    return apiSuccess([...remoteUsers, ...missingSeed])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

