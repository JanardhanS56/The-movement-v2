"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileTabBar } from "@/components/layout/MobileTabBar"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

/**
 * ============================================================================
 * DOCUMENTED UX ROUTE GUARD
 * ============================================================================
 * This client-side guard checks for an active session in demo state.
 * If unauthenticated, it presents a redirect prompt to /sign-in.
 *
 * NOTE: In production with real backend integration, route guarding is executed
 * at the edge via Next.js middleware (middleware.ts) reading Supabase session
 * cookies BEFORE the dashboard route JavaScript bundle ever loads.
 * ============================================================================
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-4"
      >
        <div className="h-10 w-10 rounded-sm bg-primary/20 text-primary flex items-center justify-center">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Authentication Required</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Please select a demo persona to view this verified movement route.
        </p>
        <Button onClick={() => router.push("/sign-in")} size="sm">
          Go to Sign In
        </Button>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  )
}
