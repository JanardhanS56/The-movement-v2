import * as React from "react"
import Link from "next/link"
import { ShieldAlert, ArrowLeft, Home, Megaphone, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-md border border-border bg-card text-center space-y-6 shadow-sm">
        {/* Status emblem */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-primary mx-auto">
          <ShieldAlert className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        {/* Heading hierarchy: single h1 */}
        <div className="space-y-2">
          <p className="tabular-nums text-xs font-semibold uppercase tracking-widest text-primary-light">
            Status Code 404
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The requested coordination channel, ledger record, or page could not be located on this movement server.
          </p>
        </div>

        {/* Action navigation links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full min-h-[44px] gap-2 border-border">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Landing Page</span>
            </Button>
          </Link>
          <Link href="/feed" className="w-full sm:w-auto">
            <Button className="w-full min-h-[44px] gap-2">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              <span>Volunteer Feed</span>
            </Button>
          </Link>
          <Link href="/tasks" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full min-h-[44px] gap-2">
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              <span>Tasks Board</span>
            </Button>
          </Link>
        </div>

        {/* Footnote */}
        <div className="pt-4 border-t border-border text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          <span>If you entered a manual URL, verify path spelling and capitalization.</span>
        </div>
      </div>
    </main>
  )
}
