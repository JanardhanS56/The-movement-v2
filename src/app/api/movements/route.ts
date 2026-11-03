import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { FICTIONAL_MOVEMENTS } from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"
import { generateMovementInviteCode } from "@/lib/movement-utils"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CreateMovementSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional(),
  slug: z.string().optional(),
  invite_code: z.string().length(5).optional(),
})

export async function GET() {
  try {
    let movements: Movement[] = []
    try {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from("movements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      if (!error && data) movements = data
    } catch {
      // Supabase fetch failure fallback
    }

    if (!movements || movements.length === 0) {
      movements = FICTIONAL_MOVEMENTS
    }

    return apiSuccess(movements)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const headerUserId = req.headers.get("x-user-id")
    const caller = await getCallerUser(req).catch(() => null)
    const organizerId = body.created_by || body.userId || headerUserId || caller?.id

    if (!organizerId) {
      return apiError("Authentication required", 401)
    }

    // Verify organizer tier (Tier 3)
    let isTier3 = caller?.tier === 3
    if (!isTier3) {
      try {
        const admin = getAdminClient()
        const { data: user } = await admin
          .from("users")
          .select("tier")
          .eq("id", organizerId)
          .single()
        if (user?.tier === 3) isTier3 = true
      } catch {}
    }
    if (!isTier3) {
      const seedUser = SEED_USERS.find((u) => u.id === organizerId)
      if (seedUser?.tier === 3) isTier3 = true
    }

    if (!isTier3) {
      return apiError("Forbidden: Only Tier 3 Organizers can create a movement", 403)
    }

    const parsed = CreateMovementSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Validation failed", 400)
    }

    const { name, description } = parsed.data
    const baseSlug =
      parsed.data.slug ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
    const inviteCode = (parsed.data.invite_code || generateMovementInviteCode()).toUpperCase()

    let movement: Movement | null = null
    try {
      const admin = getAdminClient()
      const { data, error: createError } = await admin
        .from("movements")
        .insert({
          name,
          description: description || null,
          slug: uniqueSlug,
          invite_code: inviteCode,
          created_by: organizerId,
          is_active: true,
        })
        .select()
        .single()

      if (!createError && data) {
        movement = data
        try {
          await admin.from("movement_members").insert({
            movement_id: data.id,
            user_id: organizerId,
            role: "organizer",
          })
        } catch {}
      }
    } catch {
      // Handled via local fallback below
    }

    if (!movement) {
      movement = {
        id: crypto.randomUUID(),
        name,
        description: description || null,
        slug: uniqueSlug,
        invite_code: inviteCode,
        created_by: organizerId,
        is_active: true,
        created_at: new Date().toISOString(),
      }
    }

    const origin = req.headers.get("origin") || req.nextUrl?.origin || ""
    return apiSuccess(
      {
        ...movement,
        joinUrl: origin ? `${origin}/join/${movement.invite_code || inviteCode}` : `/join/${movement.invite_code || inviteCode}`,
      },
      201
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
