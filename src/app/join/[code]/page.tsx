"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Shield, Users, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { addFictionalMovement, setActiveMovementId } from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"

export default function JoinMovementPage({
  params,
}: {
  params: { code: string }
}) {
  const router = useRouter()
  const { user, setMovementId } = useAuth()
  const code = decodeURIComponent(params.code || "").trim().toUpperCase()

  const [loading, setLoading] = React.useState(true)
  const [joining, setJoining] = React.useState(false)
  const [movement, setMovement] = React.useState<(Movement & { memberCount?: number }) | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function fetchPreview() {
      if (!code) {
        setError("Invalid or missing invite code")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/movements/invite/${code}`)
        const json = await res.json()

        if (!mounted) return

        if (!res.ok || !json.success || !json.data?.movement) {
          setError(json.error || `No active movement found for code "${code}"`)
        } else {
          setMovement(json.data.movement)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load movement preview")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchPreview()
    return () => {
      mounted = false
    }
  }, [code])

  const handleJoin = async () => {
    if (!movement) return
    setJoining(true)

    try {
      const res = await fetch("/api/movements/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          code,
          movementId: movement.id,
          userId: user?.id,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to join movement")
      }

      addFictionalMovement(movement)
      setActiveMovementId(movement.id)
      setMovementId(movement.id)

      toast.success(json.data?.message || `Joined ${movement.name}!`)
      router.push("/feed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error joining movement")
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-ink rounded-chunky p-6 shadow-hard-lg space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2 border-b-2 border-ink/10 pb-4">
          <div className="w-12 h-12 rounded-sm bg-lime border-2 border-ink flex items-center justify-center mx-auto shadow-hard-xs">
            <Shield className="w-6 h-6 text-ink" />
          </div>
          <h1 className="text-xl font-black text-ink font-sans tracking-tight">
            The Movement
          </h1>
          <p className="text-xs text-ink/60 font-semibold font-sans">
            Civic mobilization &amp; community coordination network
          </p>
        </div>

        {/* State Displays */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-cobalt animate-spin mx-auto" />
            <p className="text-xs font-bold text-ink/70">
              Verifying invite code &quot;{code}&quot;...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-tomato/10 border-2 border-tomato/30 text-tomato flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-ink">Invite Code Not Found</h2>
              <p className="text-xs text-ink/60 max-w-xs mx-auto">{error}</p>
            </div>
            <Button
              type="button"
              onClick={() => router.push("/feed")}
              variant="outline"
              size="sm"
              className="border-2 border-ink text-xs font-bold"
            >
              Return to Feed
            </Button>
          </div>
        ) : movement ? (
          <div className="space-y-5">
            {/* Movement Card Preview */}
            <div className="bg-ivory border-2 border-ink p-4 rounded-sm space-y-3 shadow-hard-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cobalt bg-cobalt/10 px-1.5 py-0.5 rounded-xs border border-cobalt/20">
                    Campaign Invite
                  </span>
                  <h2 className="text-base font-black text-ink mt-1 font-sans">
                    {movement.name}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-xs border border-ink text-ink">
                    Code: {movement.invite_code || code}
                  </span>
                </div>
              </div>

              {movement.description && (
                <p className="text-xs text-ink/80 leading-relaxed font-sans">
                  {movement.description}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-ink/10 text-[11px] text-ink/60 font-semibold font-sans">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-ink/50" />
                  <span>{movement.memberCount || 1} active members</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-lime text-ink border-2 border-ink font-black text-xs hover:bg-lime/90 shadow-hard-xs py-5 gap-2 cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining Campaign...</span>
                  </>
                ) : (
                  <>
                    <span>Join Campaign Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/feed")}
                variant="ghost"
                size="sm"
                className="w-full text-xs text-ink/60 hover:text-ink cursor-pointer"
              >
                Decline &amp; go to default feed
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

