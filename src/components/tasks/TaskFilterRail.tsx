"use client"

import * as React from "react"
import { Search, X, RotateCcw, Filter, Check } from "lucide-react"
import { TaskCategory, TaskDifficulty, TaskFilterOptions } from "@/lib/mocks/fictional-data"
import { TaskStatus } from "@/lib/schemas/task.schema"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TaskFilterRailProps {
  filters: TaskFilterOptions
  onFilterChange: <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => void
  onClearFilters: () => void
  activeFilterCount: number
  matchingCount: number
  totalCount: number
  isMobileSheet?: boolean
  onCloseMobileSheet?: () => void
  className?: string
}

const CATEGORIES: TaskCategory[] = ["Setup", "Outreach", "Cleanup", "Safety", "Logistics"]
const STATUSES: { id: TaskStatus | "all"; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "pending_verification", label: "Pending verification" },
  { id: "completed", label: "Completed" },
]
const REWARDS = [
  { id: "all", label: "Any reward" },
  { id: "high", label: "High (75+ pts)" },
  { id: "medium", label: "Medium (40-70 pts)" },
  { id: "low", label: "Low (<40 pts)" },
] as const
const SPOTS = [
  { id: "all", label: "Any spots" },
  { id: "single", label: "Single slot (1)" },
  { id: "multi", label: "Multi-slot (2+)" },
] as const
const WHEN_OPTIONS = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
] as const
const DIFFICULTIES: { id: TaskDifficulty | "all"; label: string }[] = [
  { id: "all", label: "Any difficulty" },
  { id: "Easy", label: "Easy" },
  { id: "Medium", label: "Medium" },
  { id: "Hard", label: "Hard" },
]

export function TaskFilterRail({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  matchingCount,
  totalCount,
  isMobileSheet = false,
  onCloseMobileSheet,
  className,
}: TaskFilterRailProps) {
  const [searchInput, setSearchInput] = React.useState(filters.search || "")

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFilterChange("search", searchInput)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search, onFilterChange])

  // Sync external search filter changes back to input state
  React.useEffect(() => {
    setSearchInput(filters.search || "")
  }, [filters.search])

  return (
    <aside
      aria-label="Task board filters"
      className={cn(
        "rounded-chunky border-2 border-ink bg-white shadow-hard-xs p-5 space-y-6 text-ink",
        className
      )}
    >
      {/* Header and Reset */}
      <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cobalt" aria-hidden="true" />
          <h3 className="text-base font-black tracking-tight">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-cobalt text-white text-[11px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        {isMobileSheet && onCloseMobileSheet && (
          <button
            type="button"
            onClick={onCloseMobileSheet}
            aria-label="Close filters"
            className="p-1 rounded-sm text-ink/60 hover:text-ink hover:bg-ivory"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Matching summary */}
      <div className="text-xs font-semibold text-ink/70">
        Showing <span className="font-bold text-ink">{matchingCount}</span> of {totalCount} tasks
      </div>

      {/* 1. Search input */}
      <div className="space-y-1.5">
        <label htmlFor="task-filter-search" className="text-xs font-black uppercase tracking-wider text-ink/60">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          <input
            id="task-filter-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Title, description, location..."
            className="w-full pl-9 pr-8 py-2 rounded-sm border-2 border-ink bg-card text-xs font-medium placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-cobalt"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("")
                onFilterChange("search", "")
              }}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Status filter */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          Status
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const isSelected = (filters.status || "all") === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onFilterChange("status", isSelected && s.id !== "all" ? "all" : s.id)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs font-bold border transition-all",
                  isSelected
                    ? "bg-ink text-ivory border-ink shadow-xs"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Category filter */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          Category
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange("category", "all")}
            aria-pressed={(filters.category || "all") === "all"}
            className={cn(
              "px-2.5 py-1 rounded-sm text-xs font-bold border transition-all",
              (filters.category || "all") === "all"
                ? "bg-ink text-ivory border-ink shadow-xs"
                : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
            )}
          >
            All categories
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange("category", isSelected ? "all" : cat)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs font-bold border transition-all flex items-center gap-1",
                  isSelected
                    ? "bg-cobalt text-white border-cobalt shadow-xs"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{cat}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Reward Points */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          Reward score
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {REWARDS.map((r) => {
            const isSelected = (filters.reward || "all") === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onFilterChange("reward", isSelected && r.id !== "all" ? "all" : r.id)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2 py-1.5 rounded-sm text-xs font-bold border text-left transition-all truncate",
                  isSelected
                    ? "bg-sun text-ink border-ink shadow-xs font-black"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Spots Left */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          Volunteer slots
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SPOTS.map((sp) => {
            const isSelected = (filters.spots || "all") === sp.id
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => onFilterChange("spots", isSelected && sp.id !== "all" ? "all" : sp.id)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs font-bold border transition-all",
                  isSelected
                    ? "bg-ink text-ivory border-ink shadow-xs"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {sp.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. When Filter */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          When posted
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WHEN_OPTIONS.map((w) => {
            const isSelected = (filters.when || "all") === w.id
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onFilterChange("when", isSelected && w.id !== "all" ? "all" : w.id)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs font-bold border transition-all",
                  isSelected
                    ? "bg-ink text-ivory border-ink shadow-xs"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {w.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 7. Difficulty */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-ink/60 block">
          Difficulty
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {DIFFICULTIES.map((d) => {
            const isSelected = (filters.difficulty || "all") === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onFilterChange("difficulty", isSelected && d.id !== "all" ? "all" : d.id)}
                aria-pressed={isSelected}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs font-bold border text-center transition-all",
                  isSelected
                    ? "bg-lavender text-ink border-ink shadow-xs font-black"
                    : "bg-white text-ink/80 border-ink/30 hover:border-ink hover:bg-ivory"
                )}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 8. Clear all filters */}
      <div className="pt-2 border-t-2 border-ink/10">
        <Button
          type="button"
          onClick={onClearFilters}
          disabled={activeFilterCount === 0}
          variant="outline"
          className="w-full text-xs font-bold border-2 border-ink h-9 gap-1.5 shadow-hard-xs disabled:opacity-40 disabled:shadow-none"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Clear all filters</span>
        </Button>
      </div>
    </aside>
  )
}
