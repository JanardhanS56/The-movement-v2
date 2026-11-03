import { NextRequest } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { CreateTaskSchema } from "@/lib/schemas/task.schema"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const movementId =
      searchParams.get("movementId") || "00000000-0000-4000-8000-000000000001"
    const status = searchParams.get("status")
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
      .from("tasks")
      .select("*, claims:task_claims(*)")
      .eq("movement_id", movementId)
      .order("created_at", { ascending: false })
      .limit(limit + 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data, error } = await query
    if (error) {
      return apiError("Failed to fetch tasks", 500)
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
    const body = await req.json().catch(() => ({}))

    const caller = await getCallerUser(req)
    const authorId = body.created_by || body.authorId || body.userId || caller?.id

    if (!authorId) {
      return apiError("Authentication required: authorId or user token required", 401)
    }

    // Verify Tier 3
    const { data: user } = await admin
      .from("users")
      .select("tier")
      .eq("id", authorId)
      .single()

    if (!user || user.tier !== 3) {
      return apiError("Forbidden: Only Tier 3 Organizers can create tasks", 403)
    }

    const resolvedMovementId =
      body.movement_id ||
      body.movementId ||
      "00000000-0000-4000-8000-000000000001"

    const parsed = CreateTaskSchema.safeParse({
      ...body,
      movement_id: resolvedMovementId,
      description: body.description ?? undefined,
      required_skills: Array.isArray(body.required_skills) ? body.required_skills : [],
    })

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Validation failed"
      return apiError(`Invalid task data: ${issue}`, 400)
    }

    const { movement_id, title, description, reward_points, required_volunteers, required_skills } =
      parsed.data

    const { data: task, error } = await admin
      .from("tasks")
      .insert({
        movement_id,
        created_by: authorId,
        title,
        description: description || null,
        reward_points,
        required_volunteers,
        required_skills: required_skills || [],
        status: "open",
      })
      .select()
      .single()

    if (error || !task) {
      return apiError(`Failed to create task: ${error?.message || "Database insert failed"}`, 500)
    }

    return apiSuccess(task, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

