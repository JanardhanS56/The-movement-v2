"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone, MapPin, CheckSquare, ArrowRight } from "lucide-react"
import { Monogram } from "@/components/shared/Monogram"

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12">
      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full pb-8">
        <div className="flex items-center gap-2.5">
          <Monogram className="h-8 w-8" />
          <span className="font-black text-xl tracking-tight text-foreground font-sans">The Movement</span>
        </div>
        <Link href="/sign-in">
          <Button variant="outline" size="sm" className="font-bold">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main id="main-content" className="max-w-3xl mx-auto w-full py-12 space-y-8 text-center sm:text-left">
        {/* Exactly 10 words (under the 12 words max limit) */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Verified collective action platform for civic volunteers and community organizers
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
          Coordinate field operations with cryptographic multi-signature bulletins, real-time geographic check-in maps, and community-verified volunteer bounties.
        </p>

        <div>
          <Link href="/sign-in">
            <Button size="lg" className="gap-2 font-semibold text-base px-6">
              <span>Join the movement</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {/* The Three Features Section */}
        <section aria-labelledby="features-heading" className="pt-12 space-y-6">
          <h2 id="features-heading" className="text-xl font-semibold tracking-tight text-foreground">
            Core Movement Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Card className="border-border bg-card">
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

            <Card className="border-border bg-card">
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

            <Card className="border-border bg-card">
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
      <footer className="max-w-5xl mx-auto w-full pt-12 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>The Movement platform for verified collective action.</p>
        <div className="flex items-center gap-4">
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
