import { createClient, SupabaseClient } from "@supabase/supabase-js"

let adminClient: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient

  const rawUrl =
    process.env.supabase_project_url ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wvubdtnhftzwwsrjuxpn.supabase.co"

  const supabaseUrl = rawUrl.startsWith("http")
    ? rawUrl
    : "https://wvubdtnhftzwwsrjuxpn.supabase.co"

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return adminClient
}

export async function getCallerUser(req: Request): Promise<{ id: string; tier: number } | null> {
  const admin = getAdminClient()

  // 1. Check custom headers
  const headerUserId = req.headers.get("x-user-id")
  if (headerUserId) {
    const { data: user } = await admin
      .from("users")
      .select("id, tier")
      .eq("id", headerUserId)
      .single()
    if (user) return { id: user.id, tier: user.tier }
  }

  // 2. Check Bearer token in Authorization header
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim()
    const {
      data: { user: authUser },
    } = await admin.auth.getUser(token)
    if (authUser) {
      const { data: user } = await admin
        .from("users")
        .select("id, tier")
        .eq("id", authUser.id)
        .single()
      if (user) return { id: user.id, tier: user.tier }
      return { id: authUser.id, tier: 1 }
    }
  }

  return null
}

