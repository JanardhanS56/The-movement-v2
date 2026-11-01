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
import { PlusCircle, Sparkles } from "lucide-react"
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

  if (user?.tier !== 3) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      let createdMovement: Movement | null = null

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
          createdMovement = json.data
        }
      } catch {
        // Fallback to local creation if fetch fails
      }

      if (!createdMovement) {
        createdMovement = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim() || null,
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString(),
        }
      }

      addFictionalMovement(createdMovement)
      setActiveMovementId(createdMovement.id)
      setMovementId(createdMovement.id)
      queryClient.invalidateQueries({ queryKey: QueryKeys.announcements(createdMovement.id) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(createdMovement.id) })

      toast.success(`Movement "${createdMovement.name}" created! Active movement switched.`)
      setName("")
      setDescription("")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating movement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading} disabled={loading} className="bg-lime text-ink font-bold border border-ink">
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
