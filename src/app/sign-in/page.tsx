"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Monogram } from "@/components/shared/Monogram"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { ArrowRight, Info } from "lucide-react"

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
      className="min-h-screen bg-ivory text-ink flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <Monogram className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink font-sans">
            Sign in to The Movement
          </h1>
          <p className="text-xs font-bold text-ink bg-sun border border-ink px-3 py-1 rounded-sm inline-block shadow-hard-xs">
            Demo, not real sign-in
          </p>
        </div>

        {/* Integration Documentation Alert */}
        <div
          role="note"
          aria-label="Demo role note"
          className="p-3.5 rounded-sm border-2 border-ink bg-white text-xs text-ink/80 flex items-start gap-2.5 shadow-hard-xs"
        >
          <Info className="h-4 w-4 text-cobalt shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Choose a fictional role persona below to test permissions across the movement.
          </p>
        </div>

        {/* Persona Selection Card */}
        <Card className="border-2 border-ink bg-white shadow-hard-sm">
          <CardHeader className="pb-3 border-b border-ink/10">
            <CardTitle className="text-base font-bold text-ink">Select a demo persona</CardTitle>
            <CardDescription className="text-xs text-ink/70">
              Each demo role tests different actions across the movement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4">
            {SEED_USERS.map((seedUser) => {
              const isCurrent = user?.id === seedUser.id
              return (
                <button
                  key={seedUser.id}
                  type="button"
                  onClick={() => handleSelectUser(seedUser.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-sm border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isCurrent
                      ? "border-ink bg-cobalt text-white shadow-hard-xs"
                      : "border-ink/20 bg-ivory/50 hover:bg-ivory hover:border-ink text-ink"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={seedUser.display_name} avatarUrl={seedUser.avatar_url} />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isCurrent ? "text-white" : "text-ink"}`}>
                        {seedUser.display_name}
                      </p>
                      <TierBadge
                        tier={seedUser.tier as UserTier}
                        showIcon={false}
                        className="text-xs py-0 px-1 mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                    {isCurrent ? (
                      <span className="bg-lime text-ink px-2 py-0.5 rounded-xs border border-ink">
                        Active
                      </span>
                    ) : (
                      <span className="text-cobalt flex items-center gap-1">
                        <span>Select</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {user && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/feed")}
              className="text-xs border-2 border-ink bg-white hover:bg-ivory text-ink font-bold shadow-hard-xs"
            >
              Continue to feed as {user.display_name}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
