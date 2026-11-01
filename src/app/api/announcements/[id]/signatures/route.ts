import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const announcementId = params.id

    if (!announcementId) {
      return apiError("Announcement ID is required", 400)
    }

    const { data, error } = await admin
      .from("announcement_signatures")
      .select("*, signer:users(id, display_name, avatar_url, tier)")
      .eq("announcement_id", announcementId)
      .order("signed_at", { ascending: true })

    if (error) {
      return apiError("Failed to fetch announcement signatures", 500)
    }

    return apiSuccess(data || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

