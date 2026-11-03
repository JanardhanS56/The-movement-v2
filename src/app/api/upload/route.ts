import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
])

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""

    let buffer: Buffer | null = null
    let mimeType = "image/jpeg"
    let bucket = "task-proofs"

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      const requestedBucket = formData.get("bucket") as string | null
      if (requestedBucket === "avatars" || requestedBucket === "task-proofs") {
        bucket = requestedBucket
      }

      if (!file) {
        return apiError("Missing 'file' field in multipart form data", 400)
      }

      mimeType = file.type || "image/jpeg"
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      // JSON body (base64 or dataUrl)
      const body = await req.json().catch(() => ({}))
      const rawFile = body.file || body.dataUrl || body.image
      if (body.bucket === "avatars" || body.bucket === "task-proofs") {
        bucket = body.bucket
      }

      if (!rawFile || typeof rawFile !== "string") {
        return apiError("Missing 'file' base64/dataUrl string in JSON request", 400)
      }

      if (rawFile.startsWith("data:")) {
        const matches = rawFile.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/)
        if (!matches) {
          return apiError("Invalid data URL format", 400)
        }
        mimeType = matches[1]
        buffer = Buffer.from(matches[2], "base64")
      } else {
        mimeType = body.mimeType || "image/jpeg"
        buffer = Buffer.from(rawFile, "base64")
      }
    }

    if (!buffer || buffer.length === 0) {
      return apiError("Empty file content", 400)
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return apiError(
        `Invalid file type '${mimeType}'. Allowed: image/jpeg, image/png, image/webp`,
        400
      )
    }

    const bucketMax = bucket === "avatars" ? 2 * 1024 * 1024 : MAX_FILE_SIZE_BYTES
    if (buffer.length > bucketMax) {
      return apiError(
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds allowed limit of ${(bucketMax / 1024 / 1024).toFixed(0)} MB`,
        400
      )
    }

    const ext = EXTENSION_MAP[mimeType] || "jpg"
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`

    let publicUrl = ""

    try {
      const admin = getAdminClient()
      const { data, error: uploadError } = await admin.storage
        .from(bucket)
        .upload(uniqueFilename, buffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (!uploadError && data) {
        const { data: publicData } = admin.storage.from(bucket).getPublicUrl(uniqueFilename)
        publicUrl = publicData.publicUrl
      }
    } catch {
      // Handled via local fallback below
    }

    // Fallback if cloud storage upload fails or is offline
    if (!publicUrl) {
      publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`
    }

    return apiSuccess(
      {
        url: publicUrl,
        filename: uniqueFilename,
        bucket,
        size: buffer.length,
        mimeType,
      },
      201
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
