"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, CheckCircle2, ArrowRight, UserPlus, Sparkles } from "lucide-react"
import { AVAILABLE_SKILLS } from "@/lib/constants/skills"

export default function SignUpPage() {
  const router = useRouter()

  const [formData, setFormData] = React.useState({
    first_name: "",
    last_name: "",
    gender: "prefer_not_to_say",
    age: "18",
    username: "",
    password: "",
    email: "",
    phone: "",
  })

  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successResult, setSuccessResult] = React.useState<{
    username: string
    tier: string
  } | null>(null)

  // Compute tier in real-time for live preview
  const previewTier = React.useMemo(() => {
    const hasEmail = formData.email.trim().length > 0
    const hasPhone = formData.phone.trim().length > 0
    if (hasEmail && hasPhone) return { label: "Organizer", level: 3, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
    if (hasEmail || hasPhone) return { label: "Experienced Volunteer", level: 2, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" }
    return { label: "Volunteer", level: 1, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" }
  }, [formData.email, formData.phone])

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age, 10),
          skills_interests: selectedSkills,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account")
      }

      setSuccessResult({
        username: data.data.username,
        tier: data.data.assigned_tier,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  if (successResult) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8"
      >
        <Card className="w-full max-w-md border-border bg-card p-6 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-foreground">Welcome to The Movement!</CardTitle>
            <CardDescription className="text-sm">
              Your profile has been created successfully.
            </CardDescription>
          </div>

          <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-2 text-left text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Username</span>
              <span className="font-mono font-semibold text-foreground">@{successResult.username}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Assigned Tier</span>
              <span className="font-semibold uppercase text-primary">
                {successResult.tier.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/sign-in" className="w-full">
              <Button className="w-full gap-2">
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground mb-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Volunteer Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Join decentralized field coordination and community verification.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border bg-card">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>Volunteer Profile</span>
                </CardTitle>

                {/* Live Tier Preview Badge */}
                <div className={`px-2.5 py-1 rounded-sm border text-xs font-semibold flex items-center gap-1.5 ${previewTier.color}`}>
                  <Sparkles className="w-3 h-3" />
                  <span>Tier: {previewTier.label}</span>
                </div>
              </div>
              <CardDescription className="text-xs">
                Email and Phone are optional. Adding contact methods unlocks elevated volunteer privileges.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div role="alert" className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {error}
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="first_name" className="text-xs font-medium text-foreground">First Name *</label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Priya"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="last_name" className="text-xs font-medium text-foreground">Last Name *</label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Rao"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="username" className="text-xs font-medium text-foreground">Username *</label>
                  <Input
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="priya_field"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs font-medium text-foreground">Password *</label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="gender" className="text-xs font-medium text-foreground">Gender</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                  >
                    <option value="prefer_not_to_say" className="bg-popover text-foreground">Prefer not to say</option>
                    <option value="female" className="bg-popover text-foreground">Female</option>
                    <option value="male" className="bg-popover text-foreground">Male</option>
                    <option value="non_binary" className="bg-popover text-foreground">Non-binary</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="age" className="text-xs font-medium text-foreground">Age (min 14) *</label>
                  <Input
                    id="age"
                    type="number"
                    min={14}
                    max={120}
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              {/* Skills Multi-Select Chips */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Skills & Interests (Used for Smart Task Matching)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Optional Contact Fields (Tier Boosters) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Email (Optional)</span>
                    <span className="text-[10px] text-muted-foreground">+ Tier 2</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="volunteer@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="phone" className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Phone (Optional)</span>
                    <span className="text-[10px] text-muted-foreground">+ Tier 2</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" loading={loading} className="w-full min-h-[44px]">
                Create Volunteer Profile
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <Link href="/sign-in" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
