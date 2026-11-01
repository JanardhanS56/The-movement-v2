"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SEED_TASKS } from "@/lib/mocks/seed-data"
import { FICTIONAL_USERS, TASK_META_MAP } from "@/lib/mocks/fictional-data"
import { useAuth } from "@/components/providers/AuthProvider"
import { Search, CheckSquare, Users, FileText, X, CornerDownLeft } from "lucide-react"

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  category: "Pages" | "Tasks" | "Members"
  url: string
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Listen for global Ctrl+K / Cmd+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Focus input on open
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Index pages, tasks, and people
  const allItems = React.useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = [
      { id: "p-feed", title: "Feed", subtitle: "Verified announcements & dispatches", category: "Pages", url: "/feed" },
      { id: "p-heatmap", title: "Heatmap", subtitle: "Live field coordination & check-ins", category: "Pages", url: "/heatmap" },
      { id: "p-tasks", title: "Tasks Board", subtitle: "Browse volunteer tasks & bounties", category: "Pages", url: "/tasks" },
      { id: "p-chat", title: "Chat", subtitle: "Community chat rooms and discussion", category: "Pages", url: "/chat" },
      { id: "p-chat-everyone", title: "Chat: Everyone", subtitle: "Movement-wide discussion and general updates", category: "Pages", url: "/chat?room=everyone" },
      { id: "p-chat-coastal", title: "Chat: Coastal Action Front", subtitle: "Field coordination and cleanup actions", category: "Pages", url: "/chat?room=coastal-action-front" },
      { id: "p-chat-help", title: "Chat: Help and questions", subtitle: "Questions about volunteering and tasks", category: "Pages", url: "/chat?room=help-questions" },
      { id: "p-leaderboard", title: "Leaderboard", subtitle: "Community member impact rankings", category: "Pages", url: "/tasks?view=leaderboard" },
      { id: "p-profile", title: "My Profile", subtitle: "View your verified badges & stats", category: "Pages", url: user ? `/u/${user.handle || user.id}` : "/sign-in" },
    ]

    const tasks: PaletteItem[] = SEED_TASKS.map((t) => {
      const meta = TASK_META_MAP[t.id]
      return {
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `${meta?.category || "General"} • ${t.reward_points} pts • ${t.status.replace("_", " ")}`,
        category: "Tasks",
        url: `/tasks?task=${t.id}`,
      }
    })

    const members: PaletteItem[] = FICTIONAL_USERS.map((u) => ({
      id: `user-${u.id}`,
      title: u.display_name,
      subtitle: `@${u.handle} • Tier ${u.tier} ${u.tier === 3 ? "Organizer" : u.tier === 2 ? "Steward" : "Volunteer"}`,
      category: "Members",
      url: `/u/${u.handle}`,
    }))

    return [...pages, ...tasks, ...members]
  }, [user])

  // Filter based on search query
  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return allItems.slice(0, 10)

    return allItems
      .filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
      .slice(0, 15)
  }, [allItems, query])

  const executeItem = (item: PaletteItem) => {
    onOpenChange(false)
    router.push(item.url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) executeItem(selected)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/60 backdrop-blur-xs"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl rounded-chunky border-2 border-ink bg-white shadow-hard-lg overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-ink bg-ivory">
          <Search className="w-5 h-5 text-ink/70 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, or members (Ctrl+K)..."
            aria-label="Search query"
            className="w-full bg-transparent text-sm font-bold text-ink placeholder:text-ink/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search input"
              className="p-1 rounded-sm text-ink/60 hover:text-ink hover:bg-ink/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-black uppercase rounded-xs bg-ink/10 border border-ink/20 text-ink">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink/60 font-semibold">
              No matching pages, tasks, or members found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const CategoryIcon =
                item.category === "Pages" ? FileText : item.category === "Tasks" ? CheckSquare : Users

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-lime border-ink shadow-hard-xs text-ink"
                      : "border-transparent hover:bg-ivory text-ink/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xs border border-ink flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white text-ink" : "bg-ivory text-ink/70"
                      }`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate text-ink font-sans">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-ink/60 truncate font-medium">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50 px-1.5 py-0.5 rounded-xs bg-ink/5 border border-ink/10">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-ink stroke-[2.5]" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t-2 border-ink bg-ivory text-[11px] text-ink/70 font-semibold">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded-xs bg-ink/10 border border-ink/20 font-bold">↑</kbd>
              <kbd className="px-1 py-0.5 rounded-xs bg-ink/10 border border-ink/20 font-bold ml-1">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded-xs bg-ink/10 border border-ink/20 font-bold">↵</kbd> to select
            </span>
          </div>
          <span className="text-cobalt font-bold">The Movement Demo</span>
        </div>
      </div>
    </div>
  )
}
