"use client"

import * as React from "react"
import { Eye, Trophy, Shield, Info } from "lucide-react"
import { toast } from "sonner"
import {
  ProfileSettings,
  getStoredProfileSettings,
  setStoredProfileSettings,
} from "@/lib/ui-prefs"
import { cn } from "@/lib/utils"

export interface ProfileSettingsCardProps {
  userId: string
  isCurrentUser: boolean
}

export function ProfileSettingsCard({ userId, isCurrentUser }: ProfileSettingsCardProps) {
  const [settings, setSettings] = React.useState<ProfileSettings>(() => {
    return getStoredProfileSettings(userId)
  })

  if (!isCurrentUser) {
    return null
  }

  const handleVisibilityChange = (visibility: "public" | "members") => {
    const updated: ProfileSettings = { ...settings, visibility }
    setSettings(updated)
    setStoredProfileSettings(userId, updated)
    toast.success(
      visibility === "public"
        ? "Profile visibility set to Public."
        : "Profile visibility set to Movement members only."
    )
  }

  const handleLeaderboardToggle = () => {
    const updated: ProfileSettings = {
      ...settings,
      showOnLeaderboards: !settings.showOnLeaderboards,
    }
    setSettings(updated)
    setStoredProfileSettings(userId, updated)
    toast.success(
      updated.showOnLeaderboards
        ? "You will appear on public leaderboards."
        : "Hidden on public leaderboard. You still see your own rank privately."
    )
  }

  return (
    <section
      aria-labelledby="profile-settings-heading"
      className="p-6 rounded-chunky border-2 border-ink bg-white shadow-hard-xs space-y-6"
    >
      <div className="flex items-center gap-2 border-b-2 border-ink/10 pb-3">
        <Shield className="w-5 h-5 text-cobalt" aria-hidden="true" />
        <h3 id="profile-settings-heading" className="font-sans font-black text-lg text-ink">
          Profile privacy & leaderboard settings
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Who can see my profile */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-ink/70">
            Who can see my profile
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={settings.visibility === "public"}
              onClick={() => handleVisibilityChange("public")}
              className={cn(
                "p-3 rounded-sm border-2 text-left font-bold text-xs transition-all flex flex-col gap-1",
                settings.visibility === "public"
                  ? "bg-cobalt text-white border-cobalt shadow-hard-xs"
                  : "bg-white text-ink border-ink/30 hover:border-ink hover:bg-ivory"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Public</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-normal",
                  settings.visibility === "public" ? "text-white/80" : "text-ink/60"
                )}
              >
                Anyone with link
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={settings.visibility === "members"}
              onClick={() => handleVisibilityChange("members")}
              className={cn(
                "p-3 rounded-sm border-2 text-left font-bold text-xs transition-all flex flex-col gap-1",
                settings.visibility === "members"
                  ? "bg-cobalt text-white border-cobalt shadow-hard-xs"
                  : "bg-white text-ink border-ink/30 hover:border-ink hover:bg-ivory"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Members only</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-normal",
                  settings.visibility === "members" ? "text-white/80" : "text-ink/60"
                )}
              >
                Movement peers
              </span>
            </button>
          </div>

          {settings.visibility === "members" && (
            <p className="text-xs text-tomato font-bold bg-tomato/10 p-2.5 rounded-sm border border-tomato/30">
              Only movement members can open this link.
            </p>
          )}
        </div>

        {/* 2. Show me on leaderboards */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-ink/70">
            Community leaderboards
          </label>
          <div className="p-3.5 rounded-sm border-2 border-ink/30 bg-ivory/50 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Trophy className="w-3.5 h-3.5 text-sun" />
                <span>Show me on leaderboards</span>
              </div>
              <p className="text-[11px] text-ink/60">
                {settings.showOnLeaderboards
                  ? "Your verified contributions are listed on the monthly leaderboard."
                  : "You are hidden publicly but still see your own rank privately."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.showOnLeaderboards}
              onClick={handleLeaderboardToggle}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-ink transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt",
                settings.showOnLeaderboards ? "bg-lime" : "bg-ink/20"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-ink shadow-sm transition-transform",
                  settings.showOnLeaderboards ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Demo storage note */}
      <div className="flex items-center gap-1.5 text-[11px] text-ink/60 border-t border-ink/10 pt-3">
        <Info className="w-3.5 h-3.5 text-ink/40 shrink-0" />
        <span>Stored only in this browser in the demo. The link works inside this demo only.</span>
      </div>
    </section>
  )
}
