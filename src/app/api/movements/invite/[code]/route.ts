import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { FICTIONAL_MOVEMENTS } from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const rawCode = decodeURIComponent(params.code || "").trim().toUpperCase()
    if (!rawCode) {
      return apiError("Invite code parameter is required", 400)
    }

    let foundMovement: (Movement & { memberCount?: number }) | null = null

    try {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from("movements")
        .select("*, members:movement_members(count)")
        .or(`metadata->>invite_code.eq.${rawCode},slug.ilike.${rawCode.toLowerCase()},name.ilike.%${rawCode}%`)
        .eq("is_active", true)
        .maybeSingle()

      if (!error && data) {
        const memberCount = Array.isArray(data.members)
          ? data.members[0]?.count || 1
          : 1
        foundMovement = {
          ...data,
          invite_code: data.invite_code || data.metadata?.invite_code || rawCode,
          memberCount,
        }
      }
    } catch {
      // Supabase lookup failed; handled via fallback
    }

    if (!foundMovement) {
      const match = FICTIONAL_MOVEMENTS.find(
        (m) =>
          m.invite_code?.toUpperCase() === rawCode ||
          m.slug.toUpperCase() === rawCode ||
          m.id === rawCode
      )
      if (match) {
        foundMovement = {
          ...match,
          memberCount: 12,
        }
      }
    }

    if (!foundMovement) {
      return apiError(`No active movement found for invite code "${rawCode}"`, 404)
    }

    return apiSuccess({
      movement: foundMovement,
      invite_code: foundMovement.invite_code || rawCode,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

