import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { CreateAnnouncementSchema } from "@/lib/schemas/announcement.schema"
import { createGroundTruthCommit } from "@/lib/services/ground-truth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const movementId =
      searchParams.get("movementId") || "00000000-0000-4000-8000-000000000001"
    const queryUserId = searchParams.get("userId")

    // Determine caller tier
    let isOrganizer = false
    if (queryUserId) {
      const { data: user } = await admin
        .from("users")
        .select("tier")
        .eq("id", queryUserId)
        .single()
      if (user && user.tier === 3) isOrganizer = true
    } else {
      const caller = await getCallerUser(req)
      if (caller && caller.tier === 3) isOrganizer = true
    }

    const search = searchParams.get("search") || searchParams.get("q")
    const cursor = searchParams.get("cursor") || searchParams.get("after")
    const limitParam = parseInt(searchParams.get("limit") || "20", 10)
    const limit = Math.min(Math.max(isNaN(limitParam) ? 20 : limitParam, 1), 50)
    const isPaginated =
      searchParams.has("cursor") ||
      searchParams.has("limit") ||
      searchParams.has("after") ||
      searchParams.get("paginate") === "true"

    let query = admin
      .from("announcements")
      .select("*, signatures:announcement_signatures(*)")
      .eq("movement_id", movementId)
      .order("created_at", { ascending: false })
      .limit(limit + 1)

    if (!isOrganizer) {
      query = query.eq("is_published", true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data, error } = await query
    if (error) {
      return apiError("Failed to fetch announcements", 500)
    }

    const items = data ? [...data] : []
    let nextCursor: string | null = null
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem?.created_at || items[items.length - 1]?.created_at || null
    }

    if (isPaginated) {
      return apiSuccess({
        items,
        nextCursor,
        limit,
      })
    }

    return apiSuccess(items)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json()

    // Determine author ID
    const caller = await getCallerUser(req)
    const authorId = body.authorId || body.userId || caller?.id

    if (!authorId) {
      return apiError("Authentication required: authorId or user token must be provided", 401)
    }

    // 1. Check Tier 3
    const { data: user, error: userError } = await admin
      .from("users")
      .select("tier")
      .eq("id", authorId)
      .single()

    if (userError || !user) {
      return apiError("Author profile not found", 404)
    }

    if (user.tier !== 3) {
      return apiError("Forbidden: Only Tier 3 Organizers can create announcements", 403)
    }

    // Validate announcement payload
    const parsed = CreateAnnouncementSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Validation failed"
      return apiError(`Invalid announcement data: ${issue}`, 400)
    }

    const { movement_id, title, body: contentBody, required_signatures } = parsed.data

    // 2. Insert announcement
    const { data: announcement, error: insertError } = await admin
      .from("announcements")
      .insert({
        movement_id,
        created_by: authorId,
        title,
        body: contentBody,
        required_signatures,
        is_published: required_signatures === 1,
        published_at: required_signatures === 1 ? new Date().toISOString() : null,
        metadata: { status: required_signatures === 1 ? "live" : "pending" },
      })
      .select()
      .single()

    if (insertError || !announcement) {
      return apiError("Failed to create announcement", 500)
    }

    // 3. Auto-sign by author
    await admin.from("announcement_signatures").insert({
      announcement_id: announcement.id,
      signed_by: authorId,
    })

    // 4. Count signatures and update status to live if threshold met
    const { count: currentSignatures } = await admin
      .from("announcement_signatures")
      .select("*", { count: "exact", head: true })
      .eq("announcement_id", announcement.id)

    let finalAnnouncement = announcement
    const signatureCount = currentSignatures || 1

    if (signatureCount >= required_signatures && !announcement.is_published) {
      const { data: updated } = await admin
        .from("announcements")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          metadata: { ...announcement.metadata, status: "live" },
          updated_at: new Date().toISOString(),
        })
        .eq("id", announcement.id)
        .select()
        .single()

      if (updated) finalAnnouncement = updated
    }

    // Automatically emit a Ground Truth audit commit if announcement is published
    if (finalAnnouncement.is_published) {
      await createGroundTruthCommit({
        eventType: "announcement",
        title: finalAnnouncement.title,
        summary:
          finalAnnouncement.body.length > 150
            ? `${finalAnnouncement.body.substring(0, 147)}...`
            : finalAnnouncement.body,
        details: finalAnnouncement.body,
        authorId,
        tags: ["Announcement", "Civic Notice", "Official"],
        metadata: {
          announcementId: finalAnnouncement.id,
          movementId: finalAnnouncement.movement_id,
          signaturesVerified: signatureCount,
          signaturesRequired: finalAnnouncement.required_signatures,
        },
      }).catch(() => {})
    }

    return apiSuccess(finalAnnouncement, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

