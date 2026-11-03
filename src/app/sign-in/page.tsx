"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TierBadge } from "@/components/shared/TierBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Monogram } from "@/components/shared/Monogram"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { ArrowRight, KeyRound, UserCheck } from "lucide-react"
import { logUserSession } from "@/lib/session-logger"
import DataRain from "@/components/ui/data-rain"

export default function SignInPage() {
  const router = useRouter()
  const { user, signIn } = useAuth()

  // Username login state
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [loginError, setLoginError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("username")
      if (q) setUsername(q)
    }
  }, [])

  const handleSelectUser = async (userId: string) => {
    signIn(userId)
    await logUserSession(userId, "login", { method: "demo_persona" })
    router.push("/feed")
  }

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          remember_me: rememberMe,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid username or password")
      }

      const loggedUser = data.data.user

      const numericTier: 1 | 2 | 3 =
        loggedUser.tier === "organizer" || loggedUser.tier === 3
          ? 3
          : loggedUser.tier === "experienced_volunteer" || loggedUser.tier === 2
          ? 2
          : 1

      const userObj = {
        id: loggedUser.id,
        display_name: loggedUser.display_name || loggedUser.username,
        tier: numericTier,
        created_at: new Date().toISOString(),
        metadata: {
          username: loggedUser.username,
          email: loggedUser.email,
        },
      }

      // Log session
      await logUserSession(loggedUser.id, "login", {
        username: loggedUser.username,
        method: "username_password",
      })

      // Authenticate in app context
      signIn(loggedUser.id, userObj)
      router.push("/feed")
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="relative min-h-screen bg-[#0D0F14] text-white flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden"
    >
      {/* Interactive DataRain Ambient Particle Field - Active in Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-45">
        <DataRain fullscreen count={1800} flowSpeed={0.8} obstacleRadius={55} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <Monogram className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">
            Sign in to The Movement
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Decentralized volunteer coordination and consensus verification.
          </p>
        </div>

        {/* Username Login Card */}
        <Card className="rounded-2xl border border-white/[0.12] bg-[#13151B]/80 backdrop-blur-xl ring-0 shadow-2xl shadow-black/50">
          <CardHeader className="pb-3.5 border-b border-white/[0.08]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D4E700]" aria-hidden="true" />
              <span>Username Sign In</span>
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Log in with your registered volunteer username and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleUsernameLogin} className="space-y-4">
              {loginError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium"
                >
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="login_username"
                  className="text-xs font-semibold text-neutral-300"
                >
                  Username
                </label>
                <Input
                  id="login_username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jana or volunteer"
                  className="h-10 rounded-xl border border-white/[0.15] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D4E700] focus:ring-2 focus:ring-[#D4E700]/25 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login_password"
                  className="text-xs font-semibold text-neutral-300"
                >
                  Password
                </label>
                <Input
                  id="login_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border border-white/[0.15] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D4E700] focus:ring-2 focus:ring-[#D4E700]/25 focus:outline-none transition-all duration-200"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border border-white/20 bg-black/40 text-[#D4E700] accent-[#D4E700] focus:ring-2 focus:ring-[#D4E700]/25 transition"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full min-h-[44px] mt-1.5 bg-[#D4E700] hover:bg-[#CCDE00] text-neutral-950 font-bold rounded-xl border border-black/15 shadow-md shadow-[#D4E700]/15 hover:shadow-lg hover:shadow-[#D4E700]/30 transition-all duration-200 active:scale-[0.99]"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Persona Selection Card */}
        <Card className="rounded-2xl border border-white/[0.12] bg-[#13151B]/80 backdrop-blur-xl ring-0 shadow-2xl shadow-black/50">
          <CardHeader className="pb-3.5 border-b border-white/[0.08]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#D4E700]" aria-hidden="true" />
              <span>Or select a persona</span>
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Each demo role tests different actions across the movement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4">
            {SEED_USERS.filter((seedUser) => seedUser.id === "11111111-1111-4111-8111-111111111111").map((seedUser) => {
              const isCurrent = user?.id === seedUser.id
              return (
                <button
                  key={seedUser.id}
                  type="button"
                  onClick={() => handleSelectUser(seedUser.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4E700] ${
                    isCurrent
                      ? "border-[#D4E700] bg-[#D4E700]/15 text-white shadow-sm"
                      : "border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.20] text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      name={seedUser.display_name}
                      avatarUrl={seedUser.avatar_url}
                      className="w-8 h-8 text-xs ring-1 ring-white/20"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-bold truncate text-white">
                        {seedUser.display_name}
                      </p>
                      <TierBadge
                        tier={seedUser.tier as UserTier}
                        showIcon={false}
                        className="text-[11px] py-0 px-1.5 mt-0.5 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                    {isCurrent ? (
                      <span className="bg-[#D4E700] text-neutral-950 px-2.5 py-0.5 rounded-md text-xs font-bold shadow-xs">
                        Active
                      </span>
                    ) : (
                      <span className="text-[#D4E700] flex items-center gap-1 font-semibold">
                        <span>Select</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.25]" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Create Account Link */}
        <div className="text-center text-xs text-neutral-400">
          New volunteer?{" "}
          <Link href="/sign-up" className="text-[#D4E700] hover:underline font-semibold transition-colors">
            Create an account
          </Link>
        </div>

        {/* Continue Session Link */}
        {user && (
          <div className="text-center pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/feed")}
              className="text-xs border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              Continue to feed as {user.display_name}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
