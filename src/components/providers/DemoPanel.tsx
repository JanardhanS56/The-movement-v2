"use client"

import * as React from "react"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import { TierBadge } from "@/components/shared/TierBadge"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { RotateCcw, ChevronDown, ChevronUp, UserCheck, Check } from "lucide-react"

export function DemoPanel() {
  const { user, switchDemoUser, resetDemoData } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  const tier1User = React.useMemo(() => SEED_USERS.find((u) => u.tier === 1)!, [])
  const tier2User = React.useMemo(() => SEED_USERS.find((u) => u.tier === 2)!, [])
  const tier3User = React.useMemo(() => SEED_USERS.find((u) => u.tier === 3)!, [])

  const handleReset = () => {
    resetDemoData()
    setStatusMessage("Demo data restored")
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleSelectUser = (id: string, name: string) => {
    switchDemoUser(id)
    setStatusMessage(`Switched to ${name}`)
    setTimeout(() => setStatusMessage(null), 2500)
  }

  return (
    <aside
      aria-label="Demo environment controls"
      className="fixed bottom-16 sm:bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="rounded-sm border border-border bg-card/95 backdrop-blur-md shadow-lg p-3 text-xs">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/30 text-primary-light tabular-nums text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Demo data
            </span>
            {user && (
              <span className="text-muted-foreground truncate max-w-[120px]">
                {user.display_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="demo-controls-panel"
              aria-label={isOpen ? "Collapse demo controls" : "Expand demo controls"}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>Controls</span>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Controls Panel */}
        {isOpen && (
          <div id="demo-controls-panel" className="mt-3 pt-3 border-t border-border space-y-3">
            <div>
              <p className="font-medium text-foreground text-xs mb-2">Switch Active Persona:</p>
              <div className="space-y-1.5">
                {[tier3User, tier2User, tier1User].map((demoUser) => {
                  const isSelected = user?.id === demoUser.id
                  return (
                    <button
                      key={demoUser.id}
                      type="button"
                      onClick={() => handleSelectUser(demoUser.id, demoUser.display_name)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-sm border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                        )}
                        <span className="font-medium text-xs text-foreground">
                          {demoUser.display_name}
                        </span>
                      </div>
                      <TierBadge tier={demoUser.tier as UserTier} showIcon={false} className="text-[10px] py-0 px-1.5" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full text-xs h-7 gap-1.5 border-border hover:bg-secondary"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset demo data</span>
              </Button>
            </div>
          </div>
        )}

        {/* Live Feedback Toast/Banner */}
        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 p-1 text-center tabular-nums text-[11px] text-verified bg-verified-bg/40 border border-verified/30 rounded-sm"
          >
            {statusMessage}
          </div>
        )}
      </div>
    </aside>
  )
}
