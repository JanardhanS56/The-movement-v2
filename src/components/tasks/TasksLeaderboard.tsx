"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Trophy, Award, Sparkles, ChevronDown, ChevronUp, UserCheck, Shield } from "lucide-react"
import { getLeaderboard, LeaderboardPeriod, LeaderboardEntry } from "@/lib/mocks/fictional-data"
import { useAuth } from "@/components/providers/AuthProvider"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function CustomMedal({ rank, className = "w-7 h-7" }: { rank: 1 | 2 | 3; className?: string }) {
  if (rank === 1) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        {/* Ribbon */}
        <path d="M12 2L8 16L12 14L16 16L12 2Z" fill="#FF4D2E" stroke="#060814" strokeWidth="1.5" />
        <path d="M20 2L24 16L20 14L16 16L20 2Z" fill="#255DEE" stroke="#060814" strokeWidth="1.5" />
        {/* Medal Disc */}
        <circle cx="16" cy="21" r="9" fill="#FFB81C" stroke="#060814" strokeWidth="2" />
        <circle cx="16" cy="21" r="6.5" fill="#FFB81C" stroke="#060814" strokeWidth="1" strokeDasharray="1.5 1.5" />
        {/* Star */}
        <path
          d="M16 17.5L17.2 20H19.8L17.7 21.5L18.5 24L16 22.5L13.5 24L14.3 21.5L12.2 20H14.8L16 17.5Z"
          fill="#060814"
        />
      </svg>
    )
  }
  if (rank === 2) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        {/* Ribbon */}
        <path d="M12 2L8 16L12 14L16 16L12 2Z" fill="#255DEE" stroke="#060814" strokeWidth="1.5" />
        <path d="M20 2L24 16L20 14L16 16L20 2Z" fill="#C9B6FF" stroke="#060814" strokeWidth="1.5" />
        {/* Medal Disc */}
        <circle cx="16" cy="21" r="9" fill="#C9B6FF" stroke="#060814" strokeWidth="2" />
        <circle cx="16" cy="21" r="6.5" fill="#C9B6FF" stroke="#060814" strokeWidth="1" strokeDasharray="1.5 1.5" />
        {/* Number 2 */}
        <text
          x="16"
          y="24"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fontFamily="sans-serif"
          fill="#060814"
        >
          2
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Ribbon */}
      <path d="M12 2L8 16L12 14L16 16L12 2Z" fill="#FF4D2E" stroke="#060814" strokeWidth="1.5" />
      <path d="M20 2L24 16L20 14L16 16L20 2Z" fill="#D4FF24" stroke="#060814" strokeWidth="1.5" />
      {/* Medal Disc */}
      <circle cx="16" cy="21" r="9" fill="#D4FF24" stroke="#060814" strokeWidth="2" />
      <circle cx="16" cy="21" r="6.5" fill="#D4FF24" stroke="#060814" strokeWidth="1" strokeDasharray="1.5 1.5" />
      {/* Number 3 */}
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#060814"
      >
        3
      </text>
    </svg>
  )
}

export function TasksLeaderboard() {
  const { user } = useAuth()
  const [period, setPeriod] = React.useState<LeaderboardPeriod>("month")
  const [recognizeExpanded, setRecognizeExpanded] = React.useState(false)
  const [acknowledged, setAcknowledged] = React.useState(false)

  const entries = React.useMemo(() => {
    return getLeaderboard(period, undefined, user?.id)
  }, [period, user?.id])

  const top3 = entries.slice(0, 3)
  const ranks4to10 = entries.slice(3, 10)

  // Determine current user position
  const currentUserEntry = entries.find((e) => e.isCurrentUser)
  const rank1Entry = entries[0]
  const isTier3 = user?.tier === 3

  const handleAcknowledgeTop3 = () => {
    const names = top3.map((e) => e.displayName.split(" ")[0]).join(", ")
    setAcknowledged(true)
    toast.success(
      `Recognition logged for ${names}. Impact points will be boosted 1.1x next cycle.`,
      { duration: 5000 }
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header and Period Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-ink/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sun shrink-0" aria-hidden="true" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-ink">
              Movement Leaderboard
            </h2>
          </div>
          <p className="text-xs md:text-sm text-ink/70 font-medium mt-1">
            Verified task completions and field contributions across Coastal Action Front.
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Leaderboard time periods"
          className="inline-flex items-center p-1 rounded-chunky bg-white border-2 border-ink shadow-hard-xs self-stretch sm:self-auto"
        >
          {(
            [
              { id: "month", label: "This month" },
              { id: "year", label: "This year" },
              { id: "all", label: "All time" },
            ] as const
          ).map((t) => {
            const isActive = period === t.id
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setPeriod(t.id)}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all",
                  isActive
                    ? "bg-cobalt text-white shadow-xs"
                    : "text-ink/70 hover:text-ink hover:bg-ivory"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Podium (Top 3) */}
      {top3.length >= 3 && (
        <section aria-label="Leaderboard top three podium">
          {/* Desktop order: #2 (left), #1 (center, taller), #3 (right) */}
          <div className="hidden md:grid grid-cols-3 gap-5 items-end max-w-4xl mx-auto pt-4">
            {/* Rank 2 (Left) */}
            <PodiumCard entry={top3[1]} rank={2} bgToken="bg-lavender/35" />

            {/* Rank 1 (Center, Taller) */}
            <PodiumCard entry={top3[0]} rank={1} isCenter bgToken="bg-sun/30" />

            {/* Rank 3 (Right) */}
            <PodiumCard entry={top3[2]} rank={3} bgToken="bg-lime/30" />
          </div>

          {/* Mobile view: #1 full-width on top, then #2 & #3 side-by-side */}
          <div className="md:hidden space-y-3">
            <PodiumCard entry={top3[0]} rank={1} isCenter bgToken="bg-sun/30" />
            <div className="grid grid-cols-2 gap-3">
              <PodiumCard entry={top3[1]} rank={2} bgToken="bg-lavender/35" />
              <PodiumCard entry={top3[2]} rank={3} bgToken="bg-lime/30" />
            </div>
          </div>
        </section>
      )}

      {/* Your Rank Pinned Bar */}
      {currentUserEntry && (
        <div
          role="region"
          aria-label="Your ranking"
          className="p-4 rounded-chunky border-2 border-ink bg-white shadow-hard-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-lime text-ink border border-ink font-black text-sm shrink-0">
              #{currentUserEntry.rank}
            </div>
            <div>
              <div className="text-sm font-bold text-ink">
                You are #{currentUserEntry.rank} {period === "month" ? "this month" : period === "year" ? "this year" : "all time"}
              </div>
              <div className="text-xs text-ink/70 font-medium">
                {currentUserEntry.periodScore} pts earned • {currentUserEntry.periodCompletions} task{currentUserEntry.periodCompletions === 1 ? "" : "s"} completed
                {currentUserEntry.rank > 1 && rank1Entry && (
                  <span className="ml-1 text-cobalt font-bold">
                    • {rank1Entry.periodScore - currentUserEntry.periodScore} pts behind #1 ({rank1Entry.displayName})
                  </span>
                )}
                {currentUserEntry.rank === 1 && (
                  <span className="ml-1 text-sun font-bold">
                    • You hold the top spot!
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link href={`/profile/${currentUserEntry.userId}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-2 border-ink h-8 px-3 hover:bg-ivory"
            >
              View your profile
            </Button>
          </Link>
        </div>
      )}

      {/* Ruled Rows: Ranks 4 to 10 */}
      {ranks4to10.length > 0 && (
        <section aria-label="Ranks 4 to 10" className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-ink/50 px-3">
            Honorable mentions (Ranks 4-10)
          </div>

          <div className="rounded-chunky border-2 border-ink bg-white shadow-hard-xs divide-y-2 divide-ink/10 overflow-hidden">
            {ranks4to10.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-ivory/80",
                  entry.isCurrentUser ? "bg-lime/10" : ""
                )}
              >
                {/* Left: Rank + Avatar + Name + Handle */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-sm font-black tabular-nums text-ink/70 text-center shrink-0">
                    {entry.rank}
                  </span>

                  <UserAvatar
                    name={entry.displayName}
                    avatarUrl={entry.avatarUrl}
                    className="h-9 w-9 text-xs border border-ink shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/profile/${entry.userId}`}
                        className="text-sm font-bold text-ink hover:text-cobalt hover:underline truncate"
                      >
                        {entry.displayName}
                      </Link>
                      {entry.isCurrentUser && (
                        <span className="text-[10px] font-extrabold uppercase bg-lime px-1.5 py-0.2 rounded-xs border border-ink text-ink">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink/50 font-medium truncate">
                      @{entry.handle}
                    </div>
                  </div>
                </div>

                {/* Right: Tier + Stats + Points */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:block">
                    <TierBadge tier={entry.tier} />
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-ink">
                      {entry.periodCompletions} task{entry.periodCompletions === 1 ? "" : "s"}
                    </div>
                    <div className="text-[11px] text-ink/60">
                      {entry.hoursContributed} hrs
                    </div>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="text-base md:text-lg font-black tabular-nums text-ink">
                      +{entry.periodScore}
                    </span>
                    <span className="text-xs font-semibold text-ink/60 ml-1">pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tie Rule Note */}
      <div className="text-center pt-2">
        <p className="text-xs text-ink/60 font-medium inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-ink/40" aria-hidden="true" />
          <span>Ties broken by earliest task completion in the period.</span>
        </p>
      </div>

      {/* Organizer Reward Panel (Tier 3 Only) */}
      {isTier3 && (
        <div className="rounded-chunky border-2 border-ink bg-white shadow-hard p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-sm bg-sun/30 border border-ink text-ink">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink">
                  Monthly Recognition
                </h3>
                <p className="text-xs text-ink/70 font-medium">
                  Tier 3 Organizer stewardship control for volunteer appreciation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRecognizeExpanded((prev) => !prev)}
              aria-expanded={recognizeExpanded}
              className="text-xs font-bold text-cobalt hover:underline inline-flex items-center gap-1 focus:outline-none"
            >
              <span>{recognizeExpanded ? "Hide" : "Manage"}</span>
              {recognizeExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {recognizeExpanded && (
            <div className="pt-3 border-t-2 border-ink/10 space-y-3">
              <p className="text-xs text-ink/80 leading-relaxed max-w-xl">
                Acknowledge top contributors for this cycle. Confirming recognition logs public kudos in the movement activity feed and qualifies the podium stewards for our 1.1x multiplier token.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleAcknowledgeTop3}
                  disabled={acknowledged}
                  className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink rounded-chunky font-bold text-xs shadow-hard-xs h-9 px-4"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-ink" aria-hidden="true" />
                  <span>{acknowledged ? "Top 3 acknowledged" : "Acknowledge top 3"}</span>
                </Button>

                {acknowledged && (
                  <span className="text-xs text-verified font-bold inline-flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    <span>Recognition recorded for this cycle</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PodiumCard({
  entry,
  rank,
  isCenter = false,
  bgToken,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  isCenter?: boolean
  bgToken: string
}) {
  const badgeColors: Record<1 | 2 | 3, string> = {
    1: "bg-sun text-ink border-2 border-ink",
    2: "bg-lavender text-ink border-2 border-ink",
    3: "bg-lime text-ink border-2 border-ink",
  }

  return (
    <div
      className={cn(
        "rounded-chunky border-2 border-ink bg-white shadow-hard p-5 flex flex-col items-center text-center relative transition-transform hover:-translate-y-1",
        isCenter ? "md:pb-8 md:pt-7" : "md:pb-6 md:pt-5",
        bgToken
      )}
    >
      {/* Rank Badge + Medal */}
      <div className="flex items-center justify-between w-full mb-3">
        <span
          className={cn(
            "w-7 h-7 rounded-sm flex items-center justify-center font-black text-xs shadow-hard-xs",
            badgeColors[rank]
          )}
        >
          #{rank}
        </span>
        <CustomMedal rank={rank} />
      </div>

      {/* Avatar */}
      <div className="relative mb-3">
        <UserAvatar
          name={entry.displayName}
          avatarUrl={entry.avatarUrl}
          className={cn(
            "border-2 border-ink shadow-hard-xs",
            isCenter ? "h-16 w-16 text-xl" : "h-13 w-13 text-base"
          )}
        />
        {entry.isCurrentUser && (
          <span className="absolute -bottom-1 -right-1 text-[10px] font-black uppercase bg-lime px-1.5 py-0.2 rounded-xs border border-ink text-ink shadow-xs">
            You
          </span>
        )}
      </div>

      {/* Name and Handle */}
      <Link
        href={`/profile/${entry.userId}`}
        className="font-black text-base md:text-lg text-ink hover:text-cobalt hover:underline tracking-tight max-w-full truncate"
      >
        {entry.displayName}
      </Link>
      <span className="text-xs text-ink/60 font-semibold mb-3">@{entry.handle}</span>

      {/* Score Numeral */}
      <div className="my-2">
        <div className="text-3xl md:text-4xl font-black tabular-nums text-ink font-sans tracking-tight">
          +{entry.periodScore}
        </div>
        <div className="text-[11px] font-bold text-ink/60 uppercase tracking-wider">
          points earned
        </div>
      </div>

      {/* Micro-stat */}
      <div className="mt-3 pt-3 border-t border-ink/15 w-full text-xs text-ink/80 font-bold flex items-center justify-center gap-1.5">
        <span>{entry.periodCompletions} tasks</span>
        <span className="text-ink/40">•</span>
        <span>{entry.hoursContributed} hrs</span>
      </div>
    </div>
  )
}
