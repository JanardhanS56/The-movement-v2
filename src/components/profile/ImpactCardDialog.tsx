"use client"

import * as React from "react"
import { User } from "@/lib/schemas/user.schema"
import { DemoUser, getBadgeProgress } from "@/lib/mocks/fictional-data"
import { getStoredProfilePhoto, getStoredProfileSettings } from "@/lib/ui-prefs"
import { X, Download, Share2, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export interface ImpactCardDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | DemoUser
  stats?: {
    tasksCompleted: number
    impactPoints: number
    announcementsSigned?: number
    checkInsCount?: number
  }
}

export function ImpactCardDialog({
  isOpen,
  onClose,
  user,
  stats = { tasksCompleted: 0, impactPoints: 0 },
}: ImpactCardDialogProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = React.useState(true)
  const [generationError, setGenerationError] = React.useState<string | null>(null)
  const [posterBlob, setPosterBlob] = React.useState<Blob | null>(null)
  const [posterDataUrl, setPosterDataUrl] = React.useState<string | null>(null)

  const handleUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${user.handle || user.id}`
    : `/u/${user.handle || user.id}`

  const generatePoster = React.useCallback(async () => {
    if (!canvasRef.current) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      // 1. Await fonts ready
      if (document.fonts) {
        await document.fonts.ready
      }

      const canvas = canvasRef.current
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not initialize 2D canvas context")

      // 2. Read Theme Tokens from CSS variables
      const rootStyle = getComputedStyle(document.documentElement)
      const colorIvory = rootStyle.getPropertyValue("--ivory").trim() || "#F6F0E4"
      const colorInk = rootStyle.getPropertyValue("--ink").trim() || "#060814"
      const colorLime = rootStyle.getPropertyValue("--lime").trim() || "#D4FF24"
      const colorCobalt = rootStyle.getPropertyValue("--cobalt").trim() || "#255DEE"
      const colorSun = rootStyle.getPropertyValue("--sun").trim() || "#FFB81C"
      const colorWhite = "#FFFFFF"

      // Check profile visibility: photo is drawn ONLY if public
      const profileSettings = getStoredProfileSettings(user.id)
      const isPublic = profileSettings.visibility === "public"
      const userPhoto = isPublic ? getStoredProfilePhoto(user.id) || user.avatar_url : null

      // Get up to 2 earned badges
      const badgeProgress = getBadgeProgress(user)
      const earnedBadges = badgeProgress.filter((b) => b.earned).slice(0, 2)

      // 3. Draw Background (Ivory with Outer Ink Frame)
      ctx.fillStyle = colorIvory
      ctx.fillRect(0, 0, 1080, 1920)

      // Heavy 16px Ink Outer Border
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 16
      ctx.strokeRect(8, 8, 1064, 1904)

      // Inner decorative border
      ctx.lineWidth = 4
      ctx.strokeRect(32, 32, 1016, 1856)

      // 4. Draw Header Section (y: 80 - 240)
      // Monogram logo block
      ctx.fillStyle = colorLime
      ctx.fillRect(80, 90, 100, 100)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 6
      ctx.strokeRect(80, 90, 100, 100)
      // Monogram M
      ctx.beginPath()
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 12
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(105, 160)
      ctx.lineTo(105, 120)
      ctx.lineTo(130, 145)
      ctx.lineTo(155, 120)
      ctx.lineTo(155, 160)
      ctx.stroke()

      // Title & movement label
      ctx.fillStyle = colorInk
      ctx.font = "900 48px sans-serif"
      ctx.fillText("THE MOVEMENT", 210, 145)

      ctx.fillStyle = colorInk
      ctx.font = "700 24px sans-serif"
      ctx.fillText("COASTAL ACTION FRONT • MUTUAL AID", 210, 185)

      // Divider line
      ctx.beginPath()
      ctx.moveTo(80, 230)
      ctx.lineTo(1000, 230)
      ctx.lineWidth = 6
      ctx.stroke()

      // 5. Member Identity Card Box (y: 280 - 680)
      // Card Shadow
      ctx.fillStyle = colorInk
      ctx.fillRect(92, 292, 896, 380)

      // Card Body
      ctx.fillStyle = colorWhite
      ctx.fillRect(80, 280, 896, 380)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 6
      ctx.strokeRect(80, 280, 896, 380)

      // Draw Avatar (photo if public and loaded, otherwise initials circle)
      const avatarX = 140
      const avatarY = 350
      const avatarSize = 160

      if (userPhoto) {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error("Image load failed"))
            img.src = userPhoto
          })

          ctx.save()
          ctx.beginPath()
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
          ctx.restore()

          // Avatar circular border
          ctx.beginPath()
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
          ctx.strokeStyle = colorInk
          ctx.lineWidth = 6
          ctx.stroke()
        } catch {
          // Fallback to initials circle
          drawInitials(ctx, user.display_name, avatarX, avatarY, avatarSize, colorSun, colorInk)
        }
      } else {
        // Fallback or private: draw initials
        drawInitials(ctx, user.display_name, avatarX, avatarY, avatarSize, colorSun, colorInk)
      }

      // Member Name
      ctx.fillStyle = colorInk
      ctx.font = "900 52px sans-serif"
      ctx.fillText(user.display_name, 340, 390)

      // Handle
      ctx.fillStyle = "#555555"
      ctx.font = "700 30px sans-serif"
      ctx.fillText(`@${user.handle || "volunteer"}`, 340, 440)

      // Tier Badge Pill
      const tierText =
        user.tier === 3
          ? "TIER 3 • MOVEMENT ORGANIZER"
          : user.tier === 2
          ? "TIER 2 • SENIOR STEWARD"
          : "TIER 1 • VERIFIED VOLUNTEER"

      ctx.fillStyle = colorLime
      ctx.fillRect(340, 480, 480, 56)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 4
      ctx.strokeRect(340, 480, 480, 56)

      ctx.fillStyle = colorInk
      ctx.font = "900 24px sans-serif"
      ctx.fillText(tierText, 360, 518)

      // 6. Two Big Impact Stats Cards (y: 710 - 1080)
      const statCardW = 430
      const statCardH = 340

      // Stat Card 1: Tasks Completed
      ctx.fillStyle = colorInk
      ctx.fillRect(90, 720, statCardW, statCardH)
      ctx.fillStyle = colorWhite
      ctx.fillRect(80, 710, statCardW, statCardH)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 6
      ctx.strokeRect(80, 710, statCardW, statCardH)

      ctx.fillStyle = colorLime
      ctx.fillRect(80, 710, statCardW, 30)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 4
      ctx.strokeRect(80, 710, statCardW, 30)

      ctx.fillStyle = colorInk
      ctx.font = "900 120px sans-serif"
      ctx.fillText(String(stats.tasksCompleted), 120, 890)

      ctx.fillStyle = colorInk
      ctx.font = "900 28px sans-serif"
      ctx.fillText("TASKS COMPLETED", 120, 960)

      ctx.fillStyle = "#666666"
      ctx.font = "700 22px sans-serif"
      ctx.fillText("Verified by consensus", 120, 1000)

      // Stat Card 2: Impact Points
      ctx.fillStyle = colorInk
      ctx.fillRect(560, 720, statCardW, statCardH)
      ctx.fillStyle = colorWhite
      ctx.fillRect(550, 710, statCardW, statCardH)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 6
      ctx.strokeRect(550, 710, statCardW, statCardH)

      ctx.fillStyle = colorSun
      ctx.fillRect(550, 710, statCardW, 30)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 4
      ctx.strokeRect(550, 710, statCardW, 30)

      ctx.fillStyle = colorInk
      ctx.font = "900 120px sans-serif"
      ctx.fillText(String(stats.impactPoints), 590, 890)

      ctx.fillStyle = colorInk
      ctx.font = "900 28px sans-serif"
      ctx.fillText("IMPACT POINTS", 590, 960)

      ctx.fillStyle = "#666666"
      ctx.font = "700 22px sans-serif"
      ctx.fillText("Movement ledger score", 590, 1000)

      // 7. Earned Badges Section (y: 1100 - 1580)
      ctx.fillStyle = colorInk
      ctx.font = "900 32px sans-serif"
      ctx.fillText("COMMUNITY MERIT BADGES", 80, 1150)

      const badgeBoxW = 430
      const badgeBoxH = 340

      if (earnedBadges.length > 0) {
        earnedBadges.forEach((badge, idx) => {
          const bx = idx === 0 ? 80 : 550
          const by = 1190

          ctx.fillStyle = colorWhite
          ctx.fillRect(bx, by, badgeBoxW, badgeBoxH)
          ctx.strokeStyle = colorInk
          ctx.lineWidth = 6
          ctx.strokeRect(bx, by, badgeBoxW, badgeBoxH)

          // Decorative top banner
          ctx.fillStyle = idx === 0 ? colorLime : colorSun
          ctx.fillRect(bx, by, badgeBoxW, 40)
          ctx.strokeStyle = colorInk
          ctx.lineWidth = 4
          ctx.strokeRect(bx, by, badgeBoxW, 40)

          // Badge badge icon shape
          ctx.fillStyle = colorCobalt
          ctx.beginPath()
          ctx.arc(bx + 70, by + 120, 40, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = colorInk
          ctx.lineWidth = 4
          ctx.stroke()

          ctx.fillStyle = colorWhite
          ctx.font = "900 36px sans-serif"
          ctx.fillText("★", bx + 55, by + 132)

          // Badge Name
          ctx.fillStyle = colorInk
          ctx.font = "900 32px sans-serif"
          ctx.fillText(badge.name, bx + 130, by + 130)

          // Badge Description
          ctx.fillStyle = "#444444"
          ctx.font = "600 22px sans-serif"
          const words = badge.description.split(" ")
          let line1 = ""
          let line2 = ""
          for (const w of words) {
            if ((line1 + w).length < 24) line1 += w + " "
            else line2 += w + " "
          }
          ctx.fillText(line1.trim(), bx + 30, by + 210)
          if (line2) ctx.fillText(line2.trim(), bx + 30, by + 245)

          // Status stamp
          ctx.fillStyle = colorLime
          ctx.fillRect(bx + 30, by + 275, 140, 36)
          ctx.strokeStyle = colorInk
          ctx.lineWidth = 3
          ctx.strokeRect(bx + 30, by + 275, 140, 36)
          ctx.fillStyle = colorInk
          ctx.font = "900 18px sans-serif"
          ctx.fillText("EARNED", bx + 65, by + 300)
        })
      } else {
        // Fallback single card
        ctx.fillStyle = colorWhite
        ctx.fillRect(80, 1190, 896, 260)
        ctx.strokeStyle = colorInk
        ctx.lineWidth = 6
        ctx.strokeRect(80, 1190, 896, 260)

        ctx.fillStyle = colorInk
        ctx.font = "900 32px sans-serif"
        ctx.fillText("Active Movement Contributor", 120, 1300)
        ctx.fillStyle = "#666666"
        ctx.font = "600 24px sans-serif"
        ctx.fillText("Tasks and field actions recorded in decentralized ledger.", 120, 1350)
      }

      // 8. Footer Section: Link & Legal note (y: 1620 - 1860)
      // Link Card
      ctx.fillStyle = colorWhite
      ctx.fillRect(80, 1630, 896, 120)
      ctx.strokeStyle = colorInk
      ctx.lineWidth = 6
      ctx.strokeRect(80, 1630, 896, 120)

      ctx.fillStyle = colorInk
      ctx.font = "900 36px sans-serif"
      ctx.fillText(handleUrl.replace(/^https?:\/\//, ""), 120, 1705)

      ctx.fillStyle = colorCobalt
      ctx.font = "900 28px sans-serif"
      ctx.fillText("VERIFIED PROFILE", 720, 1705)

      // Disclaimer
      ctx.fillStyle = "#666666"
      ctx.font = "700 20px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Decentralized civic coordination demonstration • The Movement", 540, 1820)
      ctx.textAlign = "left"

      // 9. Export Blob and Data URL
      canvas.toBlob((blob) => {
        if (blob) {
          setPosterBlob(blob)
          const dataUrl = canvas.toDataURL("image/png")
          setPosterDataUrl(dataUrl)
        }
        setIsGenerating(false)
      }, "image/png")
    } catch (err) {
      console.error(err)
      setGenerationError("We could not generate the impact card. Please check your browser connection and try again.")
      setIsGenerating(false)
    }
  }, [user, stats, handleUrl])

  // Run poster generation on modal open
  React.useEffect(() => {
    if (isOpen) {
      generatePoster()
    } else {
      setPosterBlob(null)
      setPosterDataUrl(null)
    }
  }, [isOpen, generatePoster])

  const handleDownload = () => {
    if (!posterBlob) {
      toast.error("Poster image is not ready yet.")
      return
    }

    try {
      const url = URL.createObjectURL(posterBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${user.handle || "volunteer"}-impact-card.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Impact card downloaded (1080x1920 poster).")
    } catch {
      toast.error("Failed to download poster image.")
    }
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(handleUrl)
        toast.success("Profile link copied.")
      }
    } catch {
      toast.error("Failed to copy link.")
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="impact-card-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-chunky border-2 border-ink bg-white p-6 shadow-hard-lg space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b-2 border-ink/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lime border border-ink flex items-center justify-center text-ink">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="impact-card-dialog-title" className="text-base font-black text-ink font-sans">
                Share impact card
              </h3>
              <p className="text-xs text-ink/60">1080 × 1920 high resolution story poster</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close impact card dialog"
            className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error State */}
        {generationError && (
          <div className="p-4 rounded-sm bg-tomato/10 border-2 border-tomato text-xs text-tomato space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Generation failed</span>
            </div>
            <p>{generationError}</p>
          </div>
        )}

        {/* Poster Preview */}
        <div className="relative bg-ivory/50 rounded-sm border-2 border-ink p-3 flex items-center justify-center min-h-[380px]">
          {/* Hidden Canvas used for offscreen 1080x1920 rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {isGenerating ? (
            <div className="text-center space-y-2">
              <div className="w-10 h-10 border-4 border-cobalt border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-ink">Rendering 1080×1920 poster...</p>
            </div>
          ) : posterDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterDataUrl}
              alt="Generated Impact Card Poster"
              className="max-h-[440px] w-auto rounded-xs border-2 border-ink shadow-hard-xs object-contain bg-white"
            />
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || !posterBlob}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-lime border-2 border-ink font-black text-xs text-ink shadow-hard-xs hover:bg-lime/90 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download image</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-white border-2 border-ink font-bold text-xs text-ink shadow-hard-xs hover:bg-ivory cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Copy link</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function drawInitials(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  size: number,
  bgColor: string,
  textColor: string
) {
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = textColor
  ctx.lineWidth = 6
  ctx.stroke()

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  ctx.fillStyle = textColor
  ctx.font = "900 64px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(initials, x + size / 2, y + size / 2 + 22)
  ctx.textAlign = "left"
}
