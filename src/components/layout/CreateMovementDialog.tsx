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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle, Sparkles, Copy, Check, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { QueryKeys } from "@/lib/query-keys"
import { addFictionalMovement, setActiveMovementId } from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"

export function CreateMovementDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user, setMovementId } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [createdMovement, setCreatedMovement] = React.useState<Movement | null>(null)
  const [copied, setCopied] = React.useState(false)

  if (user?.tier !== 3) {
    return null
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setCreatedMovement(null)
        setName("")
        setDescription("")
        setCopied(false)
      }, 200)
    }
  }

  const handleCopyLink = () => {
    if (!createdMovement?.invite_code) return
    const url = `${window.location.origin}/join/${createdMovement.invite_code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Invite link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      let resultMovement: Movement | null = null

      try {
        const res = await fetch("/api/movements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            created_by: user.id,
          }),
        })

        const json = await res.json()
        if (res.ok && json.success && json.data) {
          resultMovement = json.data
        }
      } catch {
        // Fallback to local creation if fetch fails
      }

      if (!resultMovement) {
        const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
        let fallbackCode = ""
        for (let i = 0; i < 5; i++) fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length))

        resultMovement = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim() || null,
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          invite_code: fallbackCode,
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString(),
        }
      }

      addFictionalMovement(resultMovement)
      setActiveMovementId(resultMovement.id)
      setMovementId(resultMovement.id)
      queryClient.invalidateQueries({ queryKey: QueryKeys.announcements(resultMovement.id) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(resultMovement.id) })

      setCreatedMovement(resultMovement)
      toast.success(`Movement "${resultMovement.name}" created!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating movement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button
              type="button"
              onClick={() => setOpen(true)}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed border-ink/40 text-xs font-bold justify-start hover:border-ink hover:bg-ink/5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Movement</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md bg-white border-2 border-ink">
        {createdMovement ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-ink">
                <Sparkles className="w-4 h-4 text-cobalt" />
                <span>Movement Created!</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Share this 5-character invite code or direct link with volunteers across other browsers to join your campaign.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-ivory border-2 border-ink p-4 rounded-sm text-center space-y-1 shadow-hard-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                5-Character Secret Join Code
              </p>
              <p className="text-3xl font-black font-mono tracking-widest text-ink selection:bg-lime">
                {createdMovement.invite_code || "MOV9K"}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-ink">Direct Shareable Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/join/${createdMovement.invite_code || "MOV9K"}`
                      : `/join/${createdMovement.invite_code || "MOV9K"}`
                  }
                  className="h-9 text-xs bg-ink/5 font-mono select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="border-2 border-ink gap-1.5 shrink-0 text-xs font-bold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cobalt stroke-[3]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="w-full bg-lime text-ink border-2 border-ink font-black text-xs hover:bg-lime/90 shadow-hard-xs gap-1.5 cursor-pointer"
              >
                <span>Go to Movement Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cobalt" />
                <span>Create New Movement</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Establish a new civic campaign with its own announcement feed, heatmap, and bounty board.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="movement-name" className="text-xs font-bold">
                  Movement Name
                </Label>
                <Input
                  id="movement-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. City Cleanup 2026"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="movement-desc" className="text-xs font-bold">
                  Description (Optional)
                </Label>
                <Textarea
                  id="movement-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the campaign mission and geographic boundaries..."
                  className="resize-none h-20 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !name.trim()}
                className="bg-lime text-ink font-bold border border-ink"
              >
                {loading ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
