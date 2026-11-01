import { createClient, SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null
  }

  if (browserClient) {
    return browserClient
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://wvubdtnhftzwwsrjuxpn.supabase.co")

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!anonKey) {
    return null
  }

  browserClient = createClient(supabaseUrl, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return browserClient
}

