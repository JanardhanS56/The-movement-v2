import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Home, Megaphone, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Monogram } from "@/components/shared/Monogram"

export default function NotFound() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-md border border-border bg-card text-center space-y-6 shadow-sm">
        {/* Status emblem */}
        <div className="flex items-center justify-center mx-auto">
          <Monogram className="h-16 w-16" />
        </div>

        {/* Heading hierarchy: single h1 */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-cobalt">
            Status 404
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The requested page or record could not be found.
          </p>
        </div>

        {/* Action navigation links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full min-h-[44px] gap-2 border-border font-bold">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/feed" className="w-full sm:w-auto">
            <Button className="w-full min-h-[44px] gap-2 font-bold bg-lime text-ink border-2 border-ink">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              <span>Feed</span>
            </Button>
          </Link>
          <Link href="/tasks" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full min-h-[44px] gap-2 font-bold">
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              <span>Tasks</span>
            </Button>
          </Link>
        </div>

        {/* Footnote */}
        <div className="pt-4 border-t border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          <span>If you entered a manual URL, verify path spelling and capitalization.</span>
        </div>
      </div>
    </main>
  )
}
