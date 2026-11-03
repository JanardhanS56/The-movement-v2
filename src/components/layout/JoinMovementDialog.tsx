"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { QueryKeys } from "@/lib/query-keys"
import { addFictionalMovement, setActiveMovementId } from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"

export function JoinMovementDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { user, setMovementId } = useAuth()
  const queryClient = useQueryClient()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = typeof controlledOpen === "boolean"
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return

    setLoading(true)
    try {
      const res = await fetch("/api/movements/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          code: cleanCode,
          userId: user?.id,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success || !json.data?.movement) {
        throw new Error(json.error || `Invalid movement code "${cleanCode}"`)
      }

      const joinedMovement: Movement = json.data.movement
      addFictionalMovement(joinedMovement)
      setActiveMovementId(joinedMovement.id)
      setMovementId(joinedMovement.id)

      queryClient.invalidateQueries({ queryKey: QueryKeys.announcements(joinedMovement.id) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(joinedMovement.id) })

      toast.success(json.data.message || `Joined ${joinedMovement.name}!`)
      setCode("")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join movement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger render={trigger as React.ReactElement} />
      )}
      <DialogContent className="sm:max-w-md bg-white border-2 border-ink">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cobalt" />
              <span>Join Movement with Code</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the 5-character secret code shared by the organizer (e.g. MOV9K) to join their campaign feed, tasks, and chat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="invite-code-input" className="text-xs font-bold text-ink">
              5-Character Invite Code
            </Label>
            <Input
              id="invite-code-input"
              required
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^2-9A-Z]/g, ""))}
              placeholder="e.g. MOV9K"
              className="h-12 text-center text-xl font-mono font-black tracking-widest uppercase border-2 border-ink bg-ivory shadow-hard-xs focus-visible:ring-cobalt"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-2 border-ink text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || code.trim().length !== 5}
              className="bg-lime text-ink border-2 border-ink font-black text-xs hover:bg-lime/90 shadow-hard-xs gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join Movement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

