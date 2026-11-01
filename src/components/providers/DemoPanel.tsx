"use client"

import * as React from "react"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import { TierBadge } from "@/components/shared/TierBadge"
import { SEED_USERS } from "@/lib/mocks/seed-data"
import { UserTier } from "@/lib/schemas/user.schema"
import { RotateCcw, X, UserCheck, Check, Bug } from "lucide-react"

export function DemoPanel() {
  const {
    user,
    switchDemoUser,
    resetDemoData,
    simulateFailure,
    setSimulateFailure,
    isDemoDrawerOpen,
    closeDemoDrawer,
  } = useAuth()

  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDemoDrawerOpen) {
        closeDemoDrawer()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isDemoDrawerOpen, closeDemoDrawer])

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

  if (!isDemoDrawerOpen) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-tools-title"
      className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDemoDrawer()
      }}
    >
      <div
        ref={drawerRef}
        className="w-full max-w-sm bg-ivory border-l-2 border-ink h-full p-6 flex flex-col justify-between shadow-hard overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b-2 border-ink pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-lime text-ink border border-ink text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
                  Demo data
                </span>
                <span className="text-xs text-ink/70">In-memory store</span>
              </div>
              <h2 id="demo-tools-title" className="text-xl font-black text-ink mt-2">
                Demo tools
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeDemoDrawer}
              aria-label="Close demo tools drawer"
              className="text-ink hover:bg-ink/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Persona Switcher */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Active demo persona</p>
            <div className="space-y-2">
              {[tier3User, tier2User, tier1User].map((demoUser) => {
                const isSelected = user?.id === demoUser.id
                return (
                  <button
                    key={demoUser.id}
                    type="button"
                    onClick={() => handleSelectUser(demoUser.id, demoUser.display_name)}
                    className={`w-full flex items-center justify-between p-3 rounded-sm border-2 text-left transition-all ${
                      isSelected
                        ? "border-ink bg-cobalt text-white shadow-hard-sm"
                        : "border-ink/20 bg-white text-ink hover:border-ink hover:bg-ivory"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-lime text-ink flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                        </span>
                      ) : (
                        <UserCheck className="h-4 w-4 text-ink/50 shrink-0" aria-hidden="true" />
                      )}
                      <div>
                        <div className="font-bold text-sm leading-tight">
                          {demoUser.display_name}
                        </div>
                        <div className={`text-xs ${isSelected ? "text-white/80" : "text-ink/60"}`}>
                          Tier {demoUser.tier}
                        </div>
                      </div>
                    </div>
                    <TierBadge
                      tier={demoUser.tier as UserTier}
                      showIcon={false}
                      className="text-xs py-0.5 px-2"
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Simulate Mutation Error Toggle */}
          <div className="space-y-3 border-t-2 border-ink/10 pt-4">
            <p className="text-sm font-bold text-ink">Simulate network error</p>
            <p className="text-xs text-ink/70">
              When turned on, next action mutations fail deliberately so you can inspect error states.
            </p>
            <Button
              type="button"
              variant={simulateFailure ? "destructive" : "outline"}
              size="sm"
              onClick={() => setSimulateFailure((prev) => !prev)}
              className="w-full text-xs h-9 gap-2 border-2 border-ink justify-center font-bold"
            >
              <Bug className="h-4 w-4" aria-hidden="true" />
              <span>
                {simulateFailure ? "Simulated error: ON" : "Simulate error: OFF"}
              </span>
            </Button>
          </div>

          {/* Reset Store Action */}
          <div className="space-y-3 border-t-2 border-ink/10 pt-4">
            <p className="text-sm font-bold text-ink">Reset session</p>
            <p className="text-xs text-ink/70">
              Restores seed data to its initial pristine state.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full text-xs h-9 gap-2 border-2 border-ink bg-white hover:bg-ivory text-ink font-bold"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset demo data</span>
            </Button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 p-2.5 text-center text-xs font-bold text-ink bg-lime border-2 border-ink shadow-hard-sm rounded-sm"
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  )
}
