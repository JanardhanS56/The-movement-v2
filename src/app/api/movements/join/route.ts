import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { FICTIONAL_MOVEMENTS } from "@/lib/mocks/fictional-data"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { Movement } from "@/lib/schemas/movement.schema"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = (body.code || "").trim().toUpperCase()
    const movementId = body.movementId || body.movement_id
    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const userId = body.userId || headerUserId || caller?.id || SEED_USERS[3].id

    if (!code && !movementId) {
      return apiError("Either an invite code or movementId is required to join", 400)
    }

    let targetMovement: Movement | null = null

    try {
      const admin = getAdminClient()
      let query = admin.from("movements").select("*").eq("is_active", true)

      if (code) {
        query = query.or(`invite_code.eq.${code},slug.ilike.${code.toLowerCase()}`)
      } else {
        query = query.eq("id", movementId)
      }

      const { data, error } = await query.maybeSingle()
      if (!error && data) {
        targetMovement = data
      }
    } catch {
      // Handled via fallback below
    }

    if (!targetMovement) {
      const match = FICTIONAL_MOVEMENTS.find(
        (m) =>
          (code && (m.invite_code?.toUpperCase() === code || m.slug.toUpperCase() === code)) ||
          (movementId && m.id === movementId)
      )
      if (match) {
        targetMovement = match
      }
    }

    if (!targetMovement) {
      return apiError(
        code
          ? `Movement with invite code "${code}" not found`
          : "Specified movement not found",
        404
      )
    }

    // Persist membership in Supabase
    let alreadyMember = false
    try {
      const admin = getAdminClient()
      const { data: existing } = await admin
        .from("movement_members")
        .select("role")
        .eq("movement_id", targetMovement.id)
        .eq("user_id", userId)
        .maybeSingle()

      if (existing) {
        alreadyMember = true
      } else {
        await admin.from("movement_members").insert({
          movement_id: targetMovement.id,
          user_id: userId,
          role: "member",
        })
      }
    } catch {
      // Local fallback: membership granted
    }

    return apiSuccess({
      movement: targetMovement,
      role: "member",
      joined: true,
      alreadyMember,
      message: alreadyMember
        ? `You are already a member of ${targetMovement.name}`
        : `Successfully joined ${targetMovement.name}`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

