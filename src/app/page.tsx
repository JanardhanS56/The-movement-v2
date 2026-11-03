"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone, MapPin, CheckSquare, Sparkles } from "lucide-react"
import { Monogram } from "@/components/shared/Monogram"
import DataRain from "@/components/ui/data-rain"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [enableAmbientRain, setEnableAmbientRain] = React.useState(true)

  // Redirect signed-in users directly to /feed
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/feed")
    }
  }, [isAuthenticated, router])

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
      {enableAmbientRain && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
          <DataRain fullscreen count={1800} flowSpeed={0.8} obstacleRadius={55} />
        </div>
      )}
      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pb-8">
        <div className="flex items-center gap-2.5">
          <Monogram className="h-8 w-8" />
          <span className="font-black text-xl tracking-tight text-foreground font-sans">The Movement</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnableAmbientRain((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-card/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm hover:bg-muted transition"
            title="Toggle Ambient Data Rain"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">{enableAmbientRain ? "Rain Active" : "Ambient Rain"}</span>
          </button>
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
      <main id="main-content" className="relative z-10 max-w-3xl mx-auto w-full py-12 space-y-8 text-center sm:text-left">
        {/* Exactly 10 words (under the 12 words max limit) */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Verified collective action platform for civic volunteers and community organizers
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
          Coordinate field operations with cryptographic multi-signature bulletins, real-time geographic check-in maps, and community-verified volunteer bounties.
        </p>

        {/* The Three Features Section */}
        <section aria-labelledby="features-heading" className="pt-8 space-y-6">
          <h2 id="features-heading" className="text-xl font-semibold tracking-tight text-foreground">
            Core Movement Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Card className="border-border bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <div className="h-9 w-9 rounded-sm bg-primary/10 text-primary-light flex items-center justify-center mb-2">
                  <Megaphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">Multi-Sig Announcements</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Field notices require multiple organizer cryptographic signatures before publishing to prevent false alarms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <div className="h-9 w-9 rounded-sm bg-verified/10 text-verified flex items-center justify-center mb-2">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">Live Check-in Heatmap</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Real-time GPS density visualization displaying volunteer distribution across field sectors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <div className="h-9 w-9 rounded-sm bg-accent/10 text-accent flex items-center justify-center mb-2">
                  <CheckSquare className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">Bounty Board & Verifications</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Community tasks claimed by volunteers and validated through randomized peer review consensus.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
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
