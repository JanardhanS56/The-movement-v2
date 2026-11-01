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
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { Shield, ArrowRight, KeyRound, UserCheck } from "lucide-react"
import { logUserSession } from "@/lib/session-logger"

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
          <p className="text-xs text-muted-foreground">
            Decentralized volunteer coordination and consensus verification.
          </p>
        </div>

        {/* Username Login Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Username Sign In</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Log in with your registered username and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameLogin} className="space-y-3.5">
              {loginError && (
                <div role="alert" className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="login_username" className="text-xs font-medium text-foreground">
                  Username
                </label>
                <Input
                  id="login_username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. priya or user"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login_password" className="text-xs font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="login_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-xs border-border bg-secondary text-primary focus:ring-1 focus:ring-ring"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button type="submit" loading={loading} className="w-full min-h-[42px] mt-1">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alternative: Demo Persona Quick Sign-in */}
        <Card className="border-border bg-card/60">
          <CardHeader className="pb-2.5 pt-3.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Or Select Demo Persona</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SEED_USERS.map((seedUser) => {
              const isCurrent = user?.id === seedUser.id
              return (
                <button
                  key={seedUser.id}
                  type="button"
                  onClick={() => handleSelectUser(seedUser.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-sm border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:bg-secondary/70 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={seedUser.display_name} avatarUrl={seedUser.avatar_url} className="w-7 h-7 text-xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {seedUser.display_name}
                      </p>
                      <TierBadge
                        tier={seedUser.tier as UserTier}
                        showIcon={false}
                        className="text-[9px] py-0 px-1 mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-primary shrink-0 font-medium">
                    <span>Quick Select</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          New volunteer?{" "}
          <Link href="/sign-up" className="text-primary hover:underline font-semibold">
            Create an account
          </Link>
        </div>

        {user && (
          <div className="text-center pt-1">
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
