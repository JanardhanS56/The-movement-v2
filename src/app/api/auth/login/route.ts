import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { z } from "zod"

export const dynamic = "force-dynamic"

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json().catch(() => ({}))

    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Validation failed", 400)
    }

    const { username, password } = parsed.data
    const cleanUsername = username.toLowerCase().trim()

    // 1. Look up user by username in profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle()

    let resolvedEmail: string | null = null
    let userId: string | null = null

    if (profile) {
      userId = profile.id
      resolvedEmail =
        profile.metadata?.auth_email ||
        (profile.phone ? `${profile.phone}@demo.com` : `${cleanUsername}@demo.com`)
    } else {
      // Check seeded auth users (e.g. organizer@demo.com, volunteer1@demo.com, user@demo.com)
      const { data: authUsers } = await admin.auth.admin.listUsers()
      const matched = authUsers?.users.find(
        (u) =>
          u.email === cleanUsername ||
          u.user_metadata?.username === cleanUsername ||
          u.email?.startsWith(`${cleanUsername}@`)
      )
      if (matched && matched.email) {
        resolvedEmail = matched.email
        userId = matched.id
      }
    }

    if (!resolvedEmail) {
      // Fallback try username@demo.com
      resolvedEmail = `${cleanUsername}@demo.com`
    }

    // 2. Authenticate against Supabase Auth
    const { data: authData, error: authError } = await admin.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    })

    if (authError || !authData.user) {
      return apiError("Invalid username or password", 401)
    }

    const authUser = authData.user

    // 3. Retrieve or create profile data
    let userProfile = profile
    if (!userProfile) {
      const { data: foundProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()
      userProfile = foundProfile
    }

    // 4. Log the login action
    await admin.from("user_logs").insert({
      user_id: authUser.id,
      action: "user_login",
      metadata: {
        username: cleanUsername,
        logged_in_at: new Date().toISOString(),
      },
    })

    return apiSuccess({
      user: {
        id: authUser.id,
        email: authUser.email,
        username: cleanUsername,
        display_name:
          userProfile?.first_name && userProfile?.last_name
            ? `${userProfile.first_name} ${userProfile.last_name}`
            : authUser.user_metadata?.display_name || cleanUsername,
        tier: userProfile?.tier || authUser.user_metadata?.tier || "volunteer",
      },
      session: authData.session,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}
