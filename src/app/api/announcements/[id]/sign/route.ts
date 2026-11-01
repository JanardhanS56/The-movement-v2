import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const announcementId = params.id

    if (!announcementId) {
      return apiError("Announcement ID is required", 400)
    }

    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)
    const signerId = body.signerId || body.userId || caller?.id

    if (!signerId) {
      return apiError("Authentication required: signerId must be provided", 401)
    }

    // 1. Check Tier 3
    const { data: user, error: userError } = await admin
      .from("users")
      .select("tier, display_name")
      .eq("id", signerId)
      .single()

    if (userError || !user) {
      return apiError("Signer user profile not found", 404)
    }

    if (user.tier !== 3) {
      return apiError("Forbidden: Only Tier 3 Organizers can sign announcements", 403)
    }

    // 2. Fetch target announcement
    const { data: announcement, error: annError } = await admin
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single()

    if (annError || !announcement) {
      return apiError("Announcement not found", 404)
    }

    if (announcement.is_published) {
      return apiError("Announcement is already fully signed and published", 400)
    }

    // 3. Check duplicate signature
    const { data: existingSig } = await admin
      .from("announcement_signatures")
      .select("id")
      .eq("announcement_id", announcementId)
      .eq("signed_by", signerId)
      .maybeSingle()

    if (existingSig) {
      return apiError("Conflict: You have already signed this announcement", 409)
    }

    // 4. Insert signature
    const { data: signature, error: sigError } = await admin
      .from("announcement_signatures")
      .insert({
        announcement_id: announcementId,
        signed_by: signerId,
      })
      .select()
      .single()

    if (sigError || !signature) {
      return apiError("Failed to record signature", 500)
    }

    // 5. Count signatures and update to live if threshold met
    const { count: currentSignatures } = await admin
      .from("announcement_signatures")
      .select("*", { count: "exact", head: true })
      .eq("announcement_id", announcementId)

    const totalSigned = currentSignatures || 1
    let isLive = announcement.is_published

    if (totalSigned >= announcement.required_signatures && !isLive) {
      const { error: updateError } = await admin
        .from("announcements")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          metadata: { ...announcement.metadata, status: "live" },
          updated_at: new Date().toISOString(),
        })
        .eq("id", announcementId)

      if (!updateError) {
        isLive = true
      }
    }

    return apiSuccess({
      signature,
      signed_count: totalSigned,
      required_signatures: announcement.required_signatures,
      is_published: isLive,
      status: isLive ? "live" : "pending",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

