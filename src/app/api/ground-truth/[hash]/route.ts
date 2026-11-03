import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import {
  GROUND_TRUTH_COMMITS,
  GroundTruthCommit,
} from "@/lib/mocks/ground-truth-data"
import { mapRowToCommit, GroundTruthRow } from "../route"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const rawHash = decodeURIComponent(params.hash || "").trim()
    if (!rawHash) {
      return apiError("Commit hash parameter is required", 400)
    }

    const cleanHash = rawHash.replace(/^#/, "").toLowerCase()
    const prefixedHash = `#${cleanHash}`

    let foundCommit: GroundTruthCommit | null = null

    try {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from("ground_truth_commits")
        .select("*")
        .or(`commit_hash.eq.${cleanHash},commit_hash.eq.${prefixedHash},full_sha256.eq.${cleanHash},id.eq.${rawHash}`)
        .maybeSingle()

      if (!error && data) {
        foundCommit = mapRowToCommit(data as GroundTruthRow)
      }
    } catch {
      // Supabase error; fallback to mock lookup below
    }

    if (!foundCommit) {
      const mockMatch = GROUND_TRUTH_COMMITS.find(
        (c) =>
          c.commitHash.toLowerCase() === prefixedHash ||
          c.commitHash.toLowerCase() === cleanHash ||
          c.fullSha256.toLowerCase() === cleanHash ||
          c.id === rawHash
      )
      if (mockMatch) {
        foundCommit = mockMatch
      }
    }

    if (!foundCommit) {
      return apiError(`Ground Truth commit '${rawHash}' not found`, 404)
    }

    return apiSuccess(foundCommit)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

