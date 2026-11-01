"use client"

import * as React from "react"
import { Users, Calendar, Share2, Camera, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/schemas/user.schema"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { formatDateOnly } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { PhotoCropDialog } from "./PhotoCropDialog"
import {
  getStoredProfilePhoto,
  setStoredProfilePhoto,
} from "@/lib/ui-prefs"

export interface ProfileHeaderProps {
  user: User
  isCurrentUser?: boolean
}

export function ProfileHeader({ user, isCurrentUser = false }: ProfileHeaderProps) {
  const [photoCropOpen, setPhotoCropOpen] = React.useState(false)
  const [customPhoto, setCustomPhoto] = React.useState<string | null>(() => {
    return getStoredProfilePhoto(user.id)
  })

  const effectiveAvatar = customPhoto || user.avatar_url

  const roleLabel =
    user.tier === 3
      ? "Movement organizer"
      : user.tier === 2
      ? "Senior field steward"
      : "Active volunteer"

  const handleSavePhoto = (dataUrl: string) => {
    setCustomPhoto(dataUrl)
    setStoredProfilePhoto(user.id, dataUrl)
  }

  const handleRemovePhoto = () => {
    setCustomPhoto(null)
    setStoredProfilePhoto(user.id, null)
    toast.success("Profile photo removed. Falling back to initials.")
  }

  const handleShareProfile = async () => {
    const handleUrl = `${window.location.origin}/u/${user.handle || user.id}`
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${user.display_name} | The Movement`,
          text: `Verified profile for volunteer ${user.display_name}`,
          url: handleUrl,
        })
        toast.success("Link shared.")
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(handleUrl)
        toast.success("Link copied.")
      }
    } catch {
      toast.error("Failed to copy link.")
    }
  }

  return (
    <section
      aria-label="Volunteer Member Identity"
      className="p-6 rounded-chunky border-2 border-ink bg-white shadow-hard-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar with optional change/remove buttons */}
        <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
          <UserAvatar
            name={user.display_name}
            avatarUrl={effectiveAvatar}
            className="h-20 w-20 text-xl font-bold border-2 border-ink shadow-hard-xs rounded-full"
            fallbackClassName="text-lg bg-sun text-ink font-black"
          />

          {isCurrentUser && (
            <div className="flex items-center gap-1.5 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPhotoCropOpen(true)}
                className="h-7 px-2 text-[11px] font-bold border-2 border-ink bg-white shadow-hard-xs gap-1"
              >
                <Camera className="w-3 h-3 text-cobalt" />
                <span>Change photo</span>
              </Button>

              {customPhoto && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="h-7 px-2 text-[11px] font-bold border-2 border-tomato text-tomato hover:bg-tomato/10 gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove photo</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight font-sans text-ink">
              {user.display_name}
            </h2>
            <TierBadge tier={user.tier} showIcon />
            {user.handle && (
              <span className="text-xs font-bold text-ink/60 tabular-nums">
                @{user.handle}
              </span>
            )}
          </div>

          {/* Movement Memberships row + Share Profile Button */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-ink/70">
            {/* Tag: Coastal Action Front · Movement Organizer */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ivory border-2 border-ink text-ink font-bold shadow-hard-xs">
              <Users className="h-3.5 w-3.5 text-cobalt" aria-hidden="true" />
              <span>Coastal Action Front</span>
              <span className="text-ink/40">•</span>
              <span className="text-cobalt font-black">{roleLabel}</span>
            </div>

            {/* Share Profile button right beside the tag */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareProfile}
              className="h-8 px-3 rounded-sm border-2 border-ink text-xs font-bold bg-white text-ink shadow-hard-xs hover:bg-lime gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share profile</span>
            </Button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-card border border-ink/20 text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-ink/50" aria-hidden="true" />
              <span>Joined {formatDateOnly(user.created_at)}</span>
            </div>
          </div>

          <p className="text-[11px] text-ink/50">
            The link works inside this demo only. Stored only in this browser in the demo.
          </p>
        </div>
      </div>

      {/* Photo Crop Dialog */}
      <PhotoCropDialog
        isOpen={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        onSavePhoto={handleSavePhoto}
        userName={user.display_name}
      />
    </section>
  )
}
