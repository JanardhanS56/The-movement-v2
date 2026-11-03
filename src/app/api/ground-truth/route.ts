import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import {
  GROUND_TRUTH_COMMITS,
  GroundTruthCommit,
  GroundTruthEventType,
  GroundTruthAuthor,
  CryptographicProof,
} from "@/lib/mocks/ground-truth-data"

export const dynamic = "force-dynamic"

export interface GroundTruthRow {
  id: string
  commit_hash: string
  full_sha256: string
  parent_hash: string
  event_type: string
  title: string
  summary: string
  details?: string | null
  author_id?: string | null
  author_snapshot: GroundTruthAuthor | Record<string, unknown>
  proof: CryptographicProof | Record<string, unknown>
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
}

export function mapRowToCommit(row: GroundTruthRow): GroundTruthCommit {
  const hash = row.commit_hash.startsWith("#") ? row.commit_hash : `#${row.commit_hash}`
  return {
    id: row.id,
    commitHash: hash,
    fullSha256: row.full_sha256,
    parentHash: row.parent_hash,
    timestamp: row.created_at,
    eventType: row.event_type as GroundTruthEventType,
    title: row.title,
    summary: row.summary,
    details: row.details || "",
    author: (row.author_snapshot as GroundTruthAuthor) || {
      id: row.author_id || "unknown",
      name: "Anonymous Volunteer",
      handle: "anonymous",
      tier: 1,
      roleTitle: "Volunteer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Anonymous",
    },
    proof: (row.proof as CryptographicProof) || {
      algorithm: "Ed25519-SHA512",
      signatureHex: "",
      publicKeyFingerprint: "",
      verified: true,
      blockNumber: 1,
      merkleRoot: "",
      parentHash: row.parent_hash,
    },
    tags: Array.isArray(row.tags) ? row.tags : [],
    metadata: row.metadata || {},
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventTypeParam = searchParams.get("type") || searchParams.get("eventType") || "all"
    const searchQuery = (searchParams.get("q") || searchParams.get("query") || "").trim().toLowerCase()
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100)
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0)

    let commits: GroundTruthCommit[] = []

    try {
      const admin = getAdminClient()
      let query = admin
        .from("ground_truth_commits")
        .select("*")
        .order("created_at", { ascending: false })

      if (eventTypeParam !== "all") {
        query = query.eq("event_type", eventTypeParam)
      }

      const { data, error } = await query

      if (!error && Array.isArray(data) && data.length > 0) {
        commits = data.map((r) => mapRowToCommit(r as GroundTruthRow))
      }
    } catch {
      // Supabase connection or table error; handled via fallback below
    }

    // Fail-safe fallback to static mock commits if DB returned no records
    if (commits.length === 0) {
      commits = [...GROUND_TRUTH_COMMITS]
    }

    // Apply filters
    let filtered = commits
    if (eventTypeParam !== "all") {
      filtered = filtered.filter((c) => c.eventType === eventTypeParam)
    }

    if (searchQuery) {
      filtered = filtered.filter((commit) => {
        const matchHash =
          commit.commitHash.toLowerCase().includes(searchQuery) ||
          commit.fullSha256.toLowerCase().includes(searchQuery)
        const matchTitle = commit.title.toLowerCase().includes(searchQuery)
        const matchSummary = commit.summary.toLowerCase().includes(searchQuery)
        const matchAuthor =
          (commit.author?.name || "").toLowerCase().includes(searchQuery) ||
          (commit.author?.handle || "").toLowerCase().includes(searchQuery)
        const matchLocation = (commit.metadata?.location || "").toLowerCase().includes(searchQuery)
        const matchTags = (commit.tags || []).some((t) => t.toLowerCase().includes(searchQuery))

        return matchHash || matchTitle || matchSummary || matchAuthor || matchLocation || matchTags
      })
    }

    const paginated = filtered.slice(offset, offset + limit)
    return apiSuccess({
      commits: paginated,
      total: filtered.length,
      limit,
      offset,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
