"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/schemas/user.schema"
import { SEED_USERS, SEED_MOVEMENT_ID } from "@/lib/mocks/seed-data"
import { mockStore } from "@/lib/mocks/mock-store"
import { logUserSession } from "@/lib/session-logger"

/**
 * ============================================================================
 * SUPABASE SESSION & NEXT.JS MIDDLEWARE INTEGRATION POINT
 * ============================================================================
 * In production with real backend integration, this mock session context
 * will be replaced by Supabase Auth via @supabase/ssr.
 *
 * 1. The browser will store session cookies ('sb-access-token' and 'sb-refresh-token').
 * 2. Next.js edge middleware (middleware.ts) will inspect the session cookie using:
 *      const supabase = createServerClient(..., { cookies: ... })
 *      const { data: { user } } = await supabase.auth.getUser()
 * 3. Middleware will redirect unauthenticated requests away from /(dashboard)/* to /sign-in.
 * 4. This client context currently manages mock session state in-memory only.
 * ============================================================================
 */

export interface AuthContextType {
  user: User | null
  movementId: string
  isAuthenticated: boolean
  signIn: (userId: string) => void
  signOut: () => void
  switchDemoUser: (userId: string) => void
  resetDemoData: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const DEFAULT_DEMO_USER_ID = "11111111-1111-4111-8111-111111111111" // Priya Rao (Tier 3 Organizer)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // In-memory demo user session (defaults to Priya Rao)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(DEFAULT_DEMO_USER_ID)

  const user = React.useMemo(() => {
    if (!currentUserId) return null
    return mockStore.getUser(currentUserId) || SEED_USERS.find((u) => u.id === currentUserId) || null
  }, [currentUserId])

  const signIn = React.useCallback(
    (userId: string) => {
      setCurrentUserId(userId)
      router.push("/feed")
    },
    [router]
  )

  const signOut = React.useCallback(() => {
    if (currentUserId) {
      void logUserSession(currentUserId, "logout")
    }
    setCurrentUserId(null)
    router.push("/sign-in")
  }, [currentUserId, router])

  const switchDemoUser = React.useCallback((userId: string) => {
    setCurrentUserId(userId)
  }, [])

  const resetDemoData = React.useCallback(() => {
    mockStore.reset()
    // Trigger re-render of user if modified
    setCurrentUserId((prev) => (prev ? prev : DEFAULT_DEMO_USER_ID))
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      movementId: SEED_MOVEMENT_ID,
      isAuthenticated: user !== null,
      signIn,
      signOut,
      switchDemoUser,
      resetDemoData,
    }),
    [user, signIn, signOut, switchDemoUser, resetDemoData]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
