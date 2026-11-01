import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Load .env manually if process.env values are not set
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const equalsIdx = trimmed.indexOf("=")
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim()
        const val = trimmed.slice(equalsIdx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const supabaseUrl = process.env.supabase_project_url || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wvubdtnhftzwwsrjuxpn.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error("ERR: SUPABASE_SERVICE_ROLE_KEY missing from environment.")
  process.exit(1)
}

// Clean URL in case connection string was passed to NEXT_PUBLIC_SUPABASE_URL
const resolvedUrl = supabaseUrl.startsWith("http")
  ? supabaseUrl
  : "https://wvubdtnhftzwwsrjuxpn.supabase.co"

const supabase = createClient(resolvedUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_PERSONAS = [
  {
    email: "organizer@demo.com",
    password: "password123",
    displayName: "Janardhan",
    tier: 3,
    role: "organizer",
  },
  {
    email: "volunteer1@demo.com",
    password: "password123",
    displayName: "Alex",
    tier: 2,
    role: "member",
  },
  {
    email: "volunteer2@demo.com",
    password: "password123",
    displayName: "Sam",
    tier: 2,
    role: "member",
  },
  {
    email: "user@demo.com",
    password: "password123",
    displayName: "Jordan",
    tier: 1,
    role: "member",
  },
]

export const DEMO_MOVEMENT_ID = "00000000-0000-4000-8000-000000000001"

async function seed() {
  console.log("Seeding demo personas...")
  const seededUsers: { id: string; email: string; tier: number; role: string; displayName: string }[] = []

  for (const persona of DEMO_PERSONAS) {
    const { data: listData } = await supabase.auth.admin.listUsers()
    let userId: string

    const existingUser = listData?.users.find((u) => u.email === persona.email)
    if (existingUser) {
      userId = existingUser.id
      console.log(`User ${persona.email} exists (${userId}). Updating...`)
      await supabase.auth.admin.updateUserById(userId, {
        password: persona.password,
        user_metadata: { display_name: persona.displayName, tier: persona.tier },
      })
    } else {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: persona.email,
        password: persona.password,
        email_confirm: true,
        user_metadata: { display_name: persona.displayName, tier: persona.tier },
      })

      if (createError || !createData.user) {
        throw new Error(`Failed to create ${persona.email}: ${createError?.message}`)
      }
      userId = createData.user.id
      console.log(`Created user ${persona.email} (${userId}).`)
    }

    // Ensure public.users profile matches tier and name
    const { error: profileError } = await supabase.from("users").upsert({
      id: userId,
      display_name: persona.displayName,
      tier: persona.tier,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      throw new Error(`Failed to upsert profile for ${persona.email}: ${profileError.message}`)
    }

    seededUsers.push({
      id: userId,
      email: persona.email,
      tier: persona.tier,
      role: persona.role,
      displayName: persona.displayName,
    })
  }

  const organizer = seededUsers.find((u) => u.tier === 3)!

  // Seed demo movement
  console.log("Seeding demo movement...")
  const { error: movementError } = await supabase.from("movements").upsert({
    id: DEMO_MOVEMENT_ID,
    name: "Coastal Action Front",
    slug: "coastal-action-front",
    description: "Coordinating decentralized civic action and community support across coastal Karnataka.",
    is_active: true,
    created_by: organizer.id,
    updated_at: new Date().toISOString(),
  })

  if (movementError) {
    throw new Error(`Failed to upsert movement: ${movementError.message}`)
  }

  // Seed movement members
  console.log("Seeding movement members...")
  for (const user of seededUsers) {
    const { error: memberError } = await supabase.from("movement_members").upsert({
      movement_id: DEMO_MOVEMENT_ID,
      user_id: user.id,
      role: user.role,
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      throw new Error(`Failed to upsert movement member ${user.displayName}: ${memberError.message}`)
    }
  }

  // Seed demo tasks
  console.log("Seeding demo tasks...")
  const tasksToSeed = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      movement_id: DEMO_MOVEMENT_ID,
      created_by: organizer.id,
      title: "Distribute emergency flood relief packs",
      description: "Deliver 50 standardized food and sanitation kits to displaced households at sector 4.",
      reward_points: 150,
      required_volunteers: 3,
      status: "open",
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      movement_id: DEMO_MOVEMENT_ID,
      created_by: organizer.id,
      title: "Verify clean drinking water distribution points",
      description: "Audit chlorination levels and supply consistency across 5 designated community water stations.",
      reward_points: 100,
      required_volunteers: 2,
      status: "open",
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      movement_id: DEMO_MOVEMENT_ID,
      created_by: organizer.id,
      title: "Coordinate medical triage volunteer shifts",
      description: "Ensure evening coverage and roster management for licensed volunteer nurses at the triage tent.",
      reward_points: 200,
      required_volunteers: 4,
      status: "open",
    },
  ]

  for (const task of tasksToSeed) {
    const { error: taskError } = await supabase.from("tasks").upsert({
      ...task,
      updated_at: new Date().toISOString(),
    })

    if (taskError) {
      throw new Error(`Failed to upsert task '${task.title}': ${taskError.message}`)
    }
  }

  console.log("Seeding completed successfully.")
}

seed().catch((err) => {
  console.error("ERR:", err.message)
  process.exit(1)
})

