"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Monogram } from "@/components/shared/Monogram"
import DataRain from "@/components/ui/data-rain"
import { FeatureCards } from "@/components/ui/FeatureCards"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Redirect signed-in users directly to /feed
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/feed")
    }
  }, [isAuthenticated, router])

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
      {/* Interactive DataRain Ambient Particle Field - Always Active */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <DataRain fullscreen count={1600} flowSpeed={0.75} obstacleRadius={50} />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pb-8">
        <div className="flex items-center gap-2.5">
          <Monogram className="h-8 w-8" />
          <span className="font-black text-xl tracking-tight text-foreground font-sans">The Movement</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/data-rain">
            <Button variant="outline" size="sm" className="font-bold">
              Data Rain
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="font-bold">
              Create Account
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="sm" className="font-bold">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" className="relative z-10 max-w-5xl mx-auto w-full py-12 space-y-10 text-center sm:text-left">
        <div className="max-w-3xl space-y-4">
          {/* Exactly 10 words (under the 12 words max limit) */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Verified collective action platform for civic volunteers and community organizers
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Coordinate field operations with cryptographic multi-signature bulletins, real-time geographic check-in maps, and community-verified volunteer bounties.
          </p>
        </div>

        {/* The Three Features Section */}
        <FeatureCards className="px-0 py-2" />
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full pt-12 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>The Movement platform for verified collective action.</p>
        <div className="flex items-center gap-4">
          <Link href="/data-rain" className="hover:text-foreground underline underline-offset-4">
            Data Rain Demo
          </Link>
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-foreground underline underline-offset-4">
            Terms of service
          </Link>
        </div>
        <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-lime text-ink border border-ink">
          Demo data
        </span>
      </footer>
    </div>
  )
}
