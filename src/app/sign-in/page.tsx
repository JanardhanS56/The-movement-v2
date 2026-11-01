"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { Shield, ArrowRight, Info } from "lucide-react"

/**
 * ============================================================================
 * SUPABASE SESSION & NEXT.JS MIDDLEWARE INTEGRATION POINT
 * ============================================================================
 * In production with real backend integration:
 *
 * 1. This page will render an email input for Supabase Magic Link:
 *      const { error } = await supabase.auth.signInWithOtp({ email })
 * 2. Supabase sets authentication cookies in the browser upon callback.
 * 3. Next.js edge middleware (middleware.ts) will read the session cookie
 *    using createServerClient from @supabase/ssr.
 * 4. This demo page bypasses magic link emails and directly instantiates
 *    a demo session for testing role permissions.
 * ============================================================================
 */

export default function SignInPage() {
  const router = useRouter()
  const { user, signIn } = useAuth()

  const handleSelectUser = (userId: string) => {
    signIn(userId)
    router.push("/feed")
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground mb-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to The Movement
          </h1>
          <p className="text-sm tabular-nums text-caution bg-caution-bg/30 border border-caution/40 px-3 py-1 rounded-sm inline-block">
            Demo sign-in, not real authentication
          </p>
        </div>

        {/* Integration Documentation Alert */}
        <div
          role="note"
          aria-label="Backend integration note"
          className="p-3 rounded-sm border border-border bg-card/80 text-xs text-muted-foreground flex items-start gap-2.5"
        >
          <Info className="h-4 w-4 text-primary-light shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Choose a fictional role persona below to test permissions. In production, this screen uses Supabase passwordless magic link authentication.
          </p>
        </div>

        {/* Persona Selection Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Select a Demo Persona</CardTitle>
            <CardDescription className="text-xs">
              Each persona exercises distinct authorization privileges across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SEED_USERS.map((seedUser) => {
              const isCurrent = user?.id === seedUser.id
              return (
                <button
                  key={seedUser.id}
                  type="button"
                  onClick={() => handleSelectUser(seedUser.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-sm border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:bg-secondary/70 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={seedUser.display_name} avatarUrl={seedUser.avatar_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {seedUser.display_name}
                      </p>
                      <TierBadge
                        tier={seedUser.tier as UserTier}
                        showIcon={false}
                        className="text-[10px] py-0 px-1 mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary-light shrink-0 font-medium">
                    <span>Select</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          New volunteer?{" "}
          <a href="/sign-up" className="text-primary hover:underline font-semibold">
            Create an account
          </a>
        </div>

        {user && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/feed")}
              className="text-xs border-border"
            >
              Continue to Feed as {user.display_name}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
