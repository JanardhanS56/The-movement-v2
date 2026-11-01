import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CreateMovementSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional(),
  slug: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    let query = admin
      .from("movements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    const { data: movements, error } = await query
    if (error) return apiError("Failed to fetch movements", 500)

    return apiSuccess(movements || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json().catch(() => ({}))
    const caller = await getCallerUser(req)
    const organizerId = body.created_by || body.userId || caller?.id

    if (!organizerId) {
      return apiError("Authentication required", 401)
    }

    // Verify organizer tier (Tier 3)
    const { data: user } = await admin
      .from("users")
      .select("tier")
      .eq("id", organizerId)
      .single()

    if (!user || user.tier !== 3) {
      return apiError("Forbidden: Only Tier 3 Organizers can create a movement", 403)
    }

    const parsed = CreateMovementSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Validation failed", 400)
    }

    const { name, description } = parsed.data
    const baseSlug = parsed.data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`

    const { data: movement, error: createError } = await admin
      .from("movements")
      .insert({
        name,
        description: description || null,
        slug: uniqueSlug,
        created_by: organizerId,
        is_active: true,
      })
      .select()
      .single()

    if (createError || !movement) {
      return apiError(`Failed to create movement: ${createError?.message}`, 500)
    }

    // Add creator as organizer in movement_members
    await admin.from("movement_members").insert({
      movement_id: movement.id,
      user_id: organizerId,
      role: "organizer",
    })

    return apiSuccess(movement, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
