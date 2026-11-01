import { NextRequest, NextResponse } from "next/server"
import { getAdminClient, getCallerUser } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { CreateCheckInSchema } from "@/lib/schemas/check-in.schema"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(req.url)
    const movementId =
      searchParams.get("movementId") ||
      searchParams.get("movement_id") ||
      "00000000-0000-4000-8000-000000000001"
    const rawFormat = searchParams.get("raw") === "true"

    // Fetch check-ins from the last 24 hours (or all recent check-ins)
    const { data: checkIns, error } = await admin
      .from("check_ins")
      .select("lat, lng, checked_in_at")
      .eq("movement_id", movementId)
      .order("checked_in_at", { ascending: false })
      .limit(1000)

    if (error) {
      return apiError("Failed to fetch check-in points", 500)
    }

    // Cluster and aggregate check-ins by 3 decimal places (~110m grid)
    const clusters = new Map<string, { lat: number; lng: number; count: number }>()

    for (const item of checkIns || []) {
      const roundedLat = Math.round(item.lat * 1000) / 1000
      const roundedLng = Math.round(item.lng * 1000) / 1000
      const key = `${roundedLat}:${roundedLng}`

      const existing = clusters.get(key)
      if (existing) {
        existing.count += 1
      } else {
        clusters.set(key, { lat: roundedLat, lng: roundedLng, count: 1 })
      }
    }

    // If no real check-ins yet in this movement, add baseline points for demonstration
    if (clusters.size === 0) {
      const defaultCenter = [12.875, 74.85]
      const offsets = [
        [0.0, 0.0, 5],
        [0.003, 0.002, 3],
        [-0.002, 0.004, 4],
        [0.005, -0.003, 2],
        [-0.004, -0.002, 1],
      ]
      offsets.forEach(([dLat, dLng, c]) => {
        const lat = Math.round((defaultCenter[0] + dLat) * 1000) / 1000
        const lng = Math.round((defaultCenter[1] + dLng) * 1000) / 1000
        clusters.set(`${lat}:${lng}`, { lat, lng, count: c })
      })
    }

    let maxCount = 1
    clusters.forEach((item) => {
      if (item.count > maxCount) maxCount = item.count
    })

    // Compute tuples: [lat, lng, intensity]
    const tuples: Array<[number, number, number]> = []
    const points: Array<{ lat: number; lng: number; intensity: number }> = []

    clusters.forEach((item) => {
      // Calculate normalized intensity between 0.2 and 1.0
      const intensity = Math.min(1.0, Math.max(0.2, item.count / maxCount))
      tuples.push([item.lat, item.lng, Number(intensity.toFixed(2))])
      points.push({ lat: item.lat, lng: item.lng, intensity: Number(intensity.toFixed(2)) })
    })

    if (rawFormat) {
      return NextResponse.json(tuples)
    }

    return apiSuccess({
      heatmap_tuples: tuples,
      points,
      total_check_ins: checkIns?.length || 0,
      active_clusters: clusters.size,
    })
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

    const movementId =
      body.movement_id ||
      body.movementId ||
      "00000000-0000-4000-8000-000000000001"

    let userId = body.userId || body.user_id || caller?.id

    // Fallback to first active user if unauthenticated
    if (!userId) {
      const { data: defaultUser } = await admin
        .from("users")
        .select("id")
        .limit(1)
        .single()
      userId = defaultUser?.id
    }

    if (!userId) {
      return apiError("No active user available for check-in", 401)
    }

    const parsed = CreateCheckInSchema.safeParse({
      movement_id: movementId,
      lat: body.lat,
      lng: body.lng,
      accuracy: body.accuracy,
    })

    if (!parsed.success) {
      return apiError(`Invalid check-in coordinates: ${parsed.error.issues[0]?.message}`, 400)
    }

    const { lat, lng, accuracy } = parsed.data

    // Privacy truncation: round coordinates to 3 decimal places (~110m accuracy)
    const truncatedLat = Math.round(lat * 1000) / 1000
    const truncatedLng = Math.round(lng * 1000) / 1000

    const now = new Date().toISOString()

    const { data: checkIn, error } = await admin
      .from("check_ins")
      .insert({
        movement_id: movementId,
        user_id: userId,
        lat: truncatedLat,
        lng: truncatedLng,
        accuracy: accuracy || null,
        metadata: {
          privacy_truncated: true,
          resolution: "3-decimal-deg",
        },
        checked_in_at: now,
      })
      .select()
      .single()

    if (error || !checkIn) {
      return apiError("Failed to record check-in", 500)
    }

    return apiSuccess(
      {
        check_in: checkIn,
        point: [truncatedLat, truncatedLng, 0.8],
        truncated: true,
      },
      201
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
