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
import { ArrowRight, KeyRound, UserCheck, Sparkles } from "lucide-react"
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
  const [enableAmbientRain, setEnableAmbientRain] = React.useState(true)

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
      className="relative min-h-screen bg-[#05070d] text-white flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden"
    >
      {/* Interactive DataRain Ambient Particle Field */}
      {enableAmbientRain && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
          <DataRain fullscreen count={1800} flowSpeed={0.8} obstacleRadius={55} />
        </div>
      )}

      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEnableAmbientRain((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-sm border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/10 transition"
          title="Toggle Ambient Data Rain"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#22e6ff]" aria-hidden="true" />
          <span className="hidden sm:inline">{enableAmbientRain ? "Rain Active" : "Ambient Rain"}</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <Monogram className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">
            Sign in to The Movement
          </h1>
          <p className="text-xs text-white/70">
            Decentralized volunteer coordination and consensus verification.
          </p>
        </div>

        {/* Username Login Card */}
        <Card className="border-2 border-white/20 bg-black/75 shadow-2xl backdrop-blur-xl text-white">
          <CardHeader className="pb-3 border-b border-white/10">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#22e6ff]" />
              <span>Username Sign In</span>
            </CardTitle>
            <CardDescription className="text-xs text-white/70">
              Log in with your registered volunteer username and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleUsernameLogin} className="space-y-3.5">
              {loginError && (
                <div role="alert" className="p-2.5 rounded-sm bg-tomato/20 border border-tomato/40 text-tomato text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="login_username" className="text-xs font-bold text-white/90">
                  Username
                </label>
                <Input
                  id="login_username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jana or volunteer"
                  className="h-9 border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-[#22e6ff]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login_password" className="text-xs font-bold text-white/90">
                  Password
                </label>
                <Input
                  id="login_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-[#22e6ff]"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-white/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-xs border-white/30 bg-white/10 text-cobalt focus:ring-1 focus:ring-ring"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button type="submit" loading={loading} className="w-full min-h-[42px] mt-1 bg-lime text-ink font-bold hover:bg-lime/90 border-2 border-ink shadow-hard-xs">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Persona Selection Card */}
        <Card className="border-2 border-white/20 bg-black/75 shadow-2xl backdrop-blur-xl text-white">
          <CardHeader className="pb-3 border-b border-white/10">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#22e6ff]" />
              <span>Or select a persona</span>
            </CardTitle>
            <CardDescription className="text-xs text-white/70">
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
                  className={`w-full flex items-center justify-between p-3 rounded-sm border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isCurrent
                      ? "border-white/40 bg-cobalt text-white shadow-hard-xs"
                      : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={seedUser.display_name} avatarUrl={seedUser.avatar_url} className="w-7 h-7 text-xs" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-white">
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
                      <span className="text-[#22e6ff] flex items-center gap-1">
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

        <div className="text-center text-xs text-white/70">
          New volunteer?{" "}
          <Link href="/sign-up" className="text-[#22e6ff] hover:underline font-bold">
            Create an account
          </Link>
        </div>

        {user && (
          <div className="text-center pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/feed")}
              className="text-xs border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold shadow-hard-xs"
            >
              Continue to feed as {user.display_name}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
