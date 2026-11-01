import * as React from "react"
import Link from "next/link"
import { UserX, ArrowLeft, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProfileNotFoundProps {
  userId: string
}

export function ProfileNotFound({ userId }: ProfileNotFoundProps) {
  return (
    <div
      role="region"
      aria-label="Profile not found"
      className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-md border border-dashed border-border bg-card/60"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground mb-4">
        <UserX className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Volunteer Profile Not Found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        No registered volunteer or organizer was found with identifier{" "}
        <span className="tabular-nums text-xs text-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
          {userId}
        </span>
        . The member record may not exist or could be unregistered.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/feed">
          <Button variant="outline" className="min-h-[44px] gap-2 border-border">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return to Feed</span>
          </Button>
        </Link>
        <Link href="/tasks">
          <Button className="min-h-[44px] gap-2">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            <span>Browse Tasks Board</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
