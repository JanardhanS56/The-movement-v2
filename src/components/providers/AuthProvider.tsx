"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/schemas/user.schema"
import { SEED_USERS, SEED_MOVEMENT_ID } from "@/lib/mocks/seed-data"
import { mockStore } from "@/lib/mocks/mock-store"
import { logUserSession, getStoredAuthUser, setStoredAuthUser } from "@/lib/session-logger"

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
  signIn: (userId: string, customUser?: User) => void
  signOut: () => void
  switchDemoUser: (userId: string) => void
  resetDemoData: () => void
  simulateFailure: boolean
  setSimulateFailure: React.Dispatch<React.SetStateAction<boolean>>
  isDemoDrawerOpen: boolean
  setIsDemoDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  openDemoDrawer: () => void
  closeDemoDrawer: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const DEFAULT_DEMO_USER_ID = "11111111-1111-4111-8111-111111111111" // Priya Rao (Tier 3 Organizer)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Active user session
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(DEFAULT_DEMO_USER_ID)
  const [customUser, setCustomUser] = React.useState<User | null>(null)
  const [simulateFailure, setSimulateFailure] = React.useState(false)
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = React.useState(false)

  const openDemoDrawer = React.useCallback(() => setIsDemoDrawerOpen(true), [])
  const closeDemoDrawer = React.useCallback(() => setIsDemoDrawerOpen(false), [])

  // Restore stored session if present on mount
  React.useEffect(() => {
    const stored = getStoredAuthUser()
    if (stored) {
      setCustomUser(stored)
      mockStore.upsertUser(stored)
      setCurrentUserId(stored.id)
    }
  }, [])

  const user = React.useMemo(() => {
    if (!currentUserId) return null
    if (customUser && customUser.id === currentUserId) return customUser
    return mockStore.getUser(currentUserId) || SEED_USERS.find((u) => u.id === currentUserId) || customUser || null
  }, [currentUserId, customUser])

  const signIn = React.useCallback(
    (userId: string, incomingUser?: User) => {
      let resolvedUser = incomingUser
      if (!resolvedUser) {
        resolvedUser = mockStore.getUser(userId) || SEED_USERS.find((u) => u.id === userId)
      }
      if (resolvedUser) {
        setCustomUser(resolvedUser)
        mockStore.upsertUser(resolvedUser)
        setStoredAuthUser(resolvedUser)
      }
      setCurrentUserId(userId)
      router.push("/feed")
    },
    [router]
  )

  const signOut = React.useCallback(() => {
    if (currentUserId) {
      void logUserSession(currentUserId, "logout")
    }
    setStoredAuthUser(null)
    setCustomUser(null)
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
      simulateFailure,
      setSimulateFailure,
      isDemoDrawerOpen,
      setIsDemoDrawerOpen,
      openDemoDrawer,
      closeDemoDrawer,
    }),
    [
      user,
      signIn,
      signOut,
      switchDemoUser,
      resetDemoData,
      simulateFailure,
      isDemoDrawerOpen,
      openDemoDrawer,
      closeDemoDrawer,
    ]
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
