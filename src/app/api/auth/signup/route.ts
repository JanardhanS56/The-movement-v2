import { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-response"
import { z } from "zod"

export const dynamic = "force-dynamic"

const SignupSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  gender: z.string().min(1, "Gender is required"),
  age: z.number().int().min(14, "Must be at least 14 years old"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  skills_interests: z.array(z.string()).default([]),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
})

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json().catch(() => ({}))

    const parsed = SignupSchema.safeParse({
      ...body,
      age: typeof body.age === "string" ? parseInt(body.age, 10) : body.age,
    })

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Validation failed", 400)
    }

    const {
      first_name,
      last_name,
      gender,
      age,
      username,
      password,
      skills_interests,
      email: rawEmail,
      phone: rawPhone,
    } = parsed.data

    const cleanUsername = username.toLowerCase().trim()
    const email = rawEmail && rawEmail.trim().length > 0 ? rawEmail.trim().toLowerCase() : null
    const phone = rawPhone && rawPhone.trim().length > 0 ? rawPhone.trim() : null

    // 1. Check if username already exists in profiles
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle()

    if (existingProfile) {
      return apiError("Conflict: Username is already taken", 409)
    }

    // 2. Compute Tier Assignment
    // No Email + No Phone -> 'volunteer' (1)
    // Email ONLY or Phone ONLY -> 'experienced_volunteer' (2)
    // Both Email AND Phone -> 'organizer' (3)
    let tier: "volunteer" | "experienced_volunteer" | "organizer"
    let numericTier: 1 | 2 | 3
    if (email && phone) {
      tier = "organizer"
      numericTier = 3
    } else if (email || phone) {
      tier = "experienced_volunteer"
      numericTier = 2
    } else {
      tier = "volunteer"
      numericTier = 1
    }

    // 3. Resolve Auth Email (use real email if given, or generate dummy email username@demo.com)
    const authEmail = email || `${cleanUsername}@demo.com`

    // 4. Create user in Supabase Auth
    // Note: handle_new_user() trigger in Postgres casts raw_user_meta_data->>'tier' to SMALLINT
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        first_name,
        last_name,
        display_name: `${first_name} ${last_name}`.trim(),
        tier: numericTier,
        tier_name: tier,
      },
    })

    if (authError || !authData.user) {
      return apiError(`Failed to create account: ${authError?.message || "Auth error"}`, 400)
    }

    const userId = authData.user.id

    // 5. Insert profile record
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: userId,
        username: cleanUsername,
        first_name,
        last_name,
        gender,
        age,
        skills_interests,
        phone: phone || null,
        tier,
        metadata: {
          auth_email: authEmail,
          is_dummy_email: !email,
        },
      })
      .select()
      .single()

    if (profileError || !profile) {
      // Rollback auth user if profile insert fails
      await admin.auth.admin.deleteUser(userId)
      return apiError(`Failed to save profile: ${profileError?.message || "Profile error"}`, 500)
    }

    // 6. Add to default demo movement
    const movementId = "00000000-0000-4000-8000-000000000001"
    const memberRole = tier === "organizer" ? "organizer" : "member"
    await admin.from("movement_members").upsert({
      movement_id: movementId,
      user_id: userId,
      role: memberRole,
    })

    // 7. Log signup action
    await admin.from("user_logs").insert({
      user_id: userId,
      action: "user_signup",
      metadata: {
        username: cleanUsername,
        tier,
        registered_at: new Date().toISOString(),
      },
    })

    return apiSuccess(
      {
        profile,
        assigned_tier: tier,
        username: cleanUsername,
        message: "Account created successfully",
      },
      201
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return apiError(msg, 500)
  }
}

