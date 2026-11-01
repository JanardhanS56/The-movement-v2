"use client"

import * as React from "react"
import { Badge as BadgeType } from "@/lib/schemas/badge.schema"
import { User } from "@/lib/schemas/user.schema"
import { DemoUser, getBadgeProgress } from "@/lib/mocks/fictional-data"
import { toast } from "sonner"
import { Lock, Check, X, Shield, Sparkles } from "lucide-react"

export interface BadgeGalleryProps {
  badges?: BadgeType[]
  user?: User | DemoUser | null
}

interface BadgeItem {
  badgeId: string
  name: string
  description: string
  category: "participation" | "action" | "community" | "leadership"
  earned: boolean
  progress: number
  maxProgress: number
  unit: string
}

/* 12 Distinct Inline SVG Sticker Badges Built From Token Palette */
function BadgeStickerSvg({
  badgeId,
  earned,
  className = "w-16 h-16",
}: {
  badgeId: string
  earned: boolean
  className?: string
}) {
  const strokeColor = earned ? "var(--ink)" : "currentColor"

  switch (badgeId) {
    case "first-step":
      // Footstep sticker with Lime fill and Cobalt sole
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--lime)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          {/* Walking boot stamp */}
          <path
            d="M26 18c0-2 4-2 6-2s6 1 6 3v13h-12V18z"
            fill={earned ? "var(--ink)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M24 32h16c2 0 4 2 4 5l-2 9c-.5 2-2 3-4 3H26c-2 0-3.5-1-4-3l-2-9c0-3 2-5 4-5z"
            fill={earned ? "var(--cobalt)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {earned && <circle cx="32" cy="41" r="2.5" fill="var(--ivory)" />}
        </svg>
      )

    case "getting-going":
      // 8-point burst sticker with lightning bolt in Sun Amber
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M32 4l6 14 15-4-5 15 14 6-14 6 5 15-15-4-6 14-6-14-15 4 5-15-14-6 14-6-5-15 15 4z"
            fill={earned ? "var(--sun)" : "none"}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Lightning bolt */}
          <path
            d="M34 18l-8 14h8l-4 14 12-16h-8l6-12z"
            fill={earned ? "var(--ink)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )

    case "task-master":
      // Cogwheel with Laurel check in Cobalt & Lime
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--cobalt)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M28 10h8l2 5 5 2 4-3 6 6-3 4 2 5 5 2v8l-5 2-2 5 3 4-6 6-4-3-5 2-2 5h-8l-2-5-5-2-4 3-6-6 3-4-2-5-5-2v-8l5-2 2-5-3-4 6-6 4 3 5-2 2-5z"
            fill={earned ? "var(--ivory)" : "none"}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <circle cx="32" cy="32" r="14" fill={earned ? "var(--lime)" : "none"} stroke={strokeColor} strokeWidth="2" />
          <path
            d="M27 32l4 4 8-8"
            stroke={earned ? "var(--ink)" : "currentColor"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case "point-collector":
      // Faceted Diamond Gem in Sun Amber
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M32 6l22 16-22 36L10 22 32 6z"
            fill={earned ? "var(--sun)" : "none"}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 22h44M23 22l9 36 9-36M32 6v16"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {earned && (
            <text x="32" y="32" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--ink)">
              100
            </text>
          )}
        </svg>
      )

    case "point-hero":
      // Flaming Shield with Wing in Tomato & Ivory
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M32 6c12 0 22 6 22 18 0 20-14 30-22 34C24 54 10 44 10 24c0-12 10-18 22-18z"
            fill={earned ? "var(--tomato)" : "none"}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Flame heart */}
          <path
            d="M32 18c3 4 8 8 8 15 0 5-4 9-8 9s-8-4-8-9c0-7 5-11 8-15z"
            fill={earned ? "var(--ivory)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {earned && (
            <text x="32" y="35" textAnchor="middle" fontSize="8" fontWeight="900" fill="var(--ink)">
              500
            </text>
          )}
        </svg>
      )

    case "field-eyes":
      // Binoculars / Field Radar in Lavender
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="10" width="52" height="44" rx="22" fill={earned ? "var(--lavender)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="23" cy="32" r="11" fill={earned ? "var(--ivory)" : "none"} stroke={strokeColor} strokeWidth="2" />
          <circle cx="41" cy="32" r="11" fill={earned ? "var(--ivory)" : "none"} stroke={strokeColor} strokeWidth="2" />
          <circle cx="23" cy="32" r="5" fill={earned ? "var(--ink)" : "none"} />
          <circle cx="41" cy="32" r="5" fill={earned ? "var(--ink)" : "none"} />
          <path d="M29 32h6" stroke={strokeColor} strokeWidth="3" />
        </svg>
      )

    case "co-signer":
      // Quill Pen & Scroll Flourish in Cobalt & Ivory
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 12h40v36c-8 0-12 6-20 6s-12-6-20-6V12z"
            fill={earned ? "var(--ivory)" : "none"}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Feather quill */}
          <path
            d="M44 14C38 18 30 26 26 38l-4 8 8-4c12-4 20-12 24-18-4-6-6-8-10-10z"
            fill={earned ? "var(--cobalt)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path d="M18 42c6 2 12 0 16 2" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )

    case "team-player":
      // Handshake / Linked Rings in Acid Lime & Ink
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--lime)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="25" cy="32" r="13" fill="none" stroke={strokeColor} strokeWidth="3" />
          <circle cx="39" cy="32" r="13" fill="none" stroke={strokeColor} strokeWidth="3" />
          {earned && (
            <path
              d="M32 23a13 13 0 010 18"
              stroke="var(--ink)"
              strokeWidth="3.5"
            />
          )}
        </svg>
      )

    case "steady-hands":
      // 3-Day Calendar with Checkmarks in Sun Amber
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <rect x="10" y="14" width="44" height="42" rx="6" fill={earned ? "var(--ivory)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          <path d="M10 26h44" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M20 8v8M44 8v8" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          {/* 3 checkmarks */}
          <circle cx="21" cy="36" r="4" fill={earned ? "var(--sun)" : "none"} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="32" cy="36" r="4" fill={earned ? "var(--sun)" : "none"} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="43" cy="36" r="4" fill={earned ? "var(--sun)" : "none"} stroke={strokeColor} strokeWidth="1.5" />
          <path d="M19 36l1.5 1.5 3-3M30 36l1.5 1.5 3-3M41 36l1.5 1.5 3-3" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "podium":
      // 3-Step Victory Podium with Cobalt banner
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--ivory)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          {/* 2nd step */}
          <rect x="12" y="32" width="13" height="20" fill={earned ? "var(--lavender)" : "none"} stroke={strokeColor} strokeWidth="2" />
          {/* 1st step */}
          <rect x="25" y="24" width="14" height="28" fill={earned ? "var(--cobalt)" : "none"} stroke={strokeColor} strokeWidth="2" />
          {/* 3rd step */}
          <rect x="39" y="38" width="13" height="14" fill={earned ? "var(--lime)" : "none"} stroke={strokeColor} strokeWidth="2" />
          {earned && (
            <>
              <text x="32" y="35" textAnchor="middle" fontSize="8" fontWeight="900" fill="var(--ivory)">1</text>
              <text x="18.5" y="43" textAnchor="middle" fontSize="7" fontWeight="900" fill="var(--ink)">2</text>
              <text x="45.5" y="47" textAnchor="middle" fontSize="7" fontWeight="900" fill="var(--ink)">3</text>
            </>
          )}
        </svg>
      )

    case "champion":
      // Imperial Crown with Laurel Wreath in Sun Amber & Tomato
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--sun)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          {/* Crown */}
          <path
            d="M16 42l4-20 8 8 4-12 4 12 8-8 4 20H16z"
            fill={earned ? "var(--tomato)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Laurel stars */}
          <circle cx="20" cy="22" r="2" fill={earned ? "var(--ivory)" : "none"} />
          <circle cx="32" cy="18" r="2.5" fill={earned ? "var(--ivory)" : "none"} />
          <circle cx="44" cy="22" r="2" fill={earned ? "var(--ivory)" : "none"} />
          <path d="M20 46h24" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )

    case "movement-founder":
    default:
      // Foundation Torch & Cornerstone in Lavender, Cobalt, & Ink
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill={earned ? "var(--lavender)" : "none"} stroke={strokeColor} strokeWidth="2.5" />
          {/* Torch Handle */}
          <path
            d="M30 32l4 18h-4l-2-18h2z"
            fill={earned ? "var(--ink)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M26 30h12l-2 5H28l-2-5z"
            fill={earned ? "var(--cobalt)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {/* Flame of liberty */}
          <path
            d="M32 12c4 4 8 8 6 14-2-2-4-3-6-3s-4 1-6 3c-2-6 2-10 6-14z"
            fill={earned ? "var(--tomato)" : "none"}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {earned && <circle cx="32" cy="24" r="2" fill="var(--sun)" />}
        </svg>
      )
  }
}

export function BadgeGallery({ badges = [], user }: BadgeGalleryProps) {
  const [selectedBadge, setSelectedBadge] = React.useState<BadgeItem | null>(null)

  // Compute 12 badge progress items for the current user
  const badgeItems = React.useMemo<BadgeItem[]>(() => {
    if (user) {
      const items = getBadgeProgress(user)
      return items.map((i) => ({
        badgeId: i.badgeId,
        name: i.name,
        description: i.description,
        category: i.category as BadgeItem["category"],
        earned: i.earned,
        progress: i.progress,
        maxProgress: i.maxProgress,
        unit: (i as unknown as { unit?: string }).unit || "tasks",
      }))
    }

    // Fallback if only badges array passed
    const legacyMap = new Map(badges.map((b) => [b.badge_type, b]))
    return [
      { badgeId: "first-step", name: "First step", description: "Complete your first verified task", category: "action", earned: legacyMap.has("task_complete"), progress: legacyMap.has("task_complete") ? 1 : 0, maxProgress: 1, unit: "task" },
      { badgeId: "getting-going", name: "Getting going", description: "Complete 5 community tasks", category: "action", earned: false, progress: 2, maxProgress: 5, unit: "tasks" },
      { badgeId: "task-master", name: "Task master", description: "Complete 15 community tasks", category: "action", earned: false, progress: 2, maxProgress: 15, unit: "tasks" },
      { badgeId: "point-collector", name: "Point collector", description: "Earn 100 impact points", category: "leadership", earned: true, progress: 100, maxProgress: 100, unit: "points" },
      { badgeId: "point-hero", name: "Point hero", description: "Earn 500 impact points", category: "leadership", earned: false, progress: 120, maxProgress: 500, unit: "points" },
      { badgeId: "field-eyes", name: "Field eyes", description: "Record 5 field check-ins", category: "action", earned: false, progress: 3, maxProgress: 5, unit: "check-ins" },
      { badgeId: "co-signer", name: "Co-signer", description: "Co-sign 3 movement announcements", category: "community", earned: true, progress: 3, maxProgress: 3, unit: "signatures" },
      { badgeId: "team-player", name: "Team player", description: "Verify 3 tasks for others", category: "community", earned: true, progress: 3, maxProgress: 3, unit: "tasks" },
      { badgeId: "steady-hands", name: "Steady hands", description: "Complete tasks on 3 different days", category: "participation", earned: true, progress: 3, maxProgress: 3, unit: "days" },
      { badgeId: "podium", name: "Podium", description: "Reach monthly top 3 on the leaderboard", category: "leadership", earned: false, progress: 0, maxProgress: 3, unit: "rank" },
      { badgeId: "champion", name: "Champion", description: "Monthly or yearly top rank champion", category: "leadership", earned: false, progress: 0, maxProgress: 1, unit: "rank" },
      { badgeId: "movement-founder", name: "Movement Founder", description: "Movement founder status", category: "leadership", earned: legacyMap.has("movement_founder"), progress: legacyMap.has("movement_founder") ? 1 : 0, maxProgress: 1, unit: "status" },
    ]
  }, [user, badges])

  const earnedCount = badgeItems.filter((b) => b.earned).length

  // Session toast notification when badge threshold crossed (once per badge per session)
  React.useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const STORAGE_KEY = "the-movement:notified-badges"
      const notifiedRaw = sessionStorage.getItem(STORAGE_KEY)
      const notifiedSet = new Set<string>(notifiedRaw ? JSON.parse(notifiedRaw) : [])

      const newUnlocks = badgeItems.filter((b) => b.earned && !notifiedSet.has(b.badgeId))

      if (newUnlocks.length > 0) {
        newUnlocks.forEach((badge) => {
          notifiedSet.add(badge.badgeId)
          toast.success(`Badge unlocked: ${badge.name}`, {
            description: badge.description,
          })
        })

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(notifiedSet)))
      }
    } catch {
      // Storage access protected
    }
  }, [badgeItems])

  return (
    <section aria-labelledby="badges-heading" className="space-y-4">
      {/* Section Header: Sentence case with 'N of 12 earned' */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cobalt" aria-hidden="true" />
          <h3 id="badges-heading" className="text-lg font-black tracking-tight text-ink font-sans">
            Badges
          </h3>
        </div>
        <span className="text-xs tabular-nums font-bold px-2.5 py-1 rounded-sm bg-sun/20 text-ink border-2 border-ink shadow-hard-xs">
          {earnedCount} of {badgeItems.length} earned
        </span>
      </div>

      {/* Grid of 12 distinct sticker badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badgeItems.map((badge) => {
          return (
            <button
              key={badge.badgeId}
              type="button"
              onClick={() => setSelectedBadge(badge)}
              aria-label={`Badge: ${badge.name}. ${badge.earned ? "Earned" : `Locked. Progress: ${badge.progress} of ${badge.maxProgress} ${badge.unit}`}`}
              className={`group relative flex flex-col items-center text-center p-4 rounded-chunky border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
                badge.earned
                  ? "bg-white border-ink shadow-hard-xs hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                  : "bg-ivory/60 border-dashed border-ink/30 text-ink/60 hover:border-ink/60 hover:bg-white/60"
              }`}
            >
              {/* Sticker Graphic */}
              <div className="relative mb-3 flex items-center justify-center">
                <BadgeStickerSvg
                  badgeId={badge.badgeId}
                  earned={badge.earned}
                  className={`w-16 h-16 transition-transform group-hover:scale-105 ${
                    badge.earned ? "drop-shadow-xs" : "opacity-40 grayscale"
                  }`}
                />

                {/* Status Indicator pill */}
                {badge.earned ? (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-lime border-2 border-ink flex items-center justify-center text-ink shadow-hard-xs"
                    aria-hidden="true"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ivory border-2 border-ink/40 flex items-center justify-center text-ink/60"
                    aria-hidden="true"
                  >
                    <Lock className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Badge Title */}
              <span className="font-black text-sm text-ink group-hover:text-cobalt transition-colors line-clamp-1 font-sans">
                {badge.name}
              </span>

              {/* Status / Progress text */}
              {badge.earned ? (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-cobalt">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>Earned</span>
                </span>
              ) : (
                <div className="mt-1.5 w-full space-y-1">
                  <span className="text-[11px] font-bold text-ink/70 block">
                    Locked
                  </span>
                  <div className="w-full bg-ink/10 h-1.5 rounded-full overflow-hidden border border-ink/20">
                    <div
                      className="bg-cobalt h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums font-medium text-ink/60 block">
                    {badge.progress} of {badge.maxProgress} {badge.unit}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Accessible Badge Detail Modal */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          onClick={() => setSelectedBadge(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedBadge(null)
          }}
        >
          <div
            className="w-full max-w-sm rounded-chunky border-2 border-ink bg-white p-6 shadow-hard-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <BadgeStickerSvg
                  badgeId={selectedBadge.badgeId}
                  earned={selectedBadge.earned}
                  className="w-14 h-14"
                />
                <div>
                  <h4 id="badge-dialog-title" className="text-base font-black text-ink font-sans">
                    {selectedBadge.name}
                  </h4>
                  <span
                    className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-sm border-2 border-ink ${
                      selectedBadge.earned ? "bg-lime text-ink" : "bg-ivory text-ink/70"
                    }`}
                  >
                    {selectedBadge.earned ? "Earned badge" : "Locked badge"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                aria-label="Close badge details"
                className="p-1 rounded-sm border-2 border-ink hover:bg-ivory text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-ink/80 leading-relaxed font-sans">
              {selectedBadge.description}
            </p>

            {/* Progress details */}
            <div className="p-3 rounded-sm bg-ivory border-2 border-ink space-y-2">
              <div className="flex justify-between text-xs font-bold text-ink">
                <span>Progress</span>
                <span className="tabular-nums">
                  {selectedBadge.progress} / {selectedBadge.maxProgress} {selectedBadge.unit}
                </span>
              </div>
              <div className="w-full bg-ink/10 h-2 rounded-full overflow-hidden border border-ink/20">
                <div
                  className="bg-cobalt h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((selectedBadge.progress / selectedBadge.maxProgress) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2 rounded-sm bg-ink text-white border-2 border-ink font-bold text-xs shadow-hard-xs hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:outline-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
