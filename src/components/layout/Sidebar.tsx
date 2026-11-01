"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Monogram } from "@/components/shared/Monogram"
import { Button } from "@/components/ui/button"
import { MovementSwitcher } from "./MovementSwitcher"
import { UserMenu } from "./UserMenu"
import { useNotificationCounts } from "./NotificationInbox"
import { getTaskCounts } from "@/lib/mocks/fictional-data"
import { SEED_TASKS, SEED_TASK_CLAIMS } from "@/lib/mocks/seed-data"
import { getStoredSavedTasks } from "@/lib/ui-prefs"
import {
  Megaphone,
  MapPin,
  CheckSquare,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bookmark,
  ShieldCheck,
  ListTodo,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const { pendingAnnouncements, pendingTasks } = useNotificationCounts()

  // Task sub-link counts
  const savedTaskIds = React.useMemo(() => {
    return getStoredSavedTasks()
  }, [])

  const taskCounts = React.useMemo(() => {
    return getTaskCounts(user, SEED_TASKS, SEED_TASK_CLAIMS, savedTaskIds)
  }, [user, savedTaskIds])

  const navItems = [
    {
      label: "Feed",
      href: "/feed",
      icon: Megaphone,
      needsYouCount: pendingAnnouncements.length,
    },
    {
      label: "Heatmap",
      href: "/heatmap",
      icon: MapPin,
      needsYouCount: 0,
    },
    {
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      needsYouCount: pendingTasks.length,
      subLinks: [
        { label: "My tasks", href: "/tasks?tab=mine", count: taskCounts.mine, icon: ListTodo },
        { label: "Saved", href: "/tasks?tab=saved", count: taskCounts.saved, icon: Bookmark },
        {
          label: "Needs my verification",
          href: "/tasks?tab=verification",
          count: taskCounts.needsVerification,
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "My Profile",
      href: user ? `/u/${user.handle || user.id}` : "/sign-in",
      icon: UserIcon,
      needsYouCount: 0,
    },
  ]

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={`hidden md:flex flex-col border-r-2 border-ink bg-ivory transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 1. Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b-2 border-ink">
        {!collapsed && (
          <Link
            href="/feed"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt rounded-sm"
          >
            <Monogram className="h-7 w-7 shrink-0" />
            <span className="font-black text-lg tracking-tight text-ink font-sans">
              The Movement
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          className="ml-auto text-ink hover:bg-ink/10 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* 2. Movement Switcher at the top */}
      <MovementSwitcher collapsed={collapsed} />

      {/* 3. Navigation Links */}
      <nav aria-label="Sidebar Links" className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${
                  isActive
                    ? "bg-lime text-ink font-black border-2 border-ink shadow-hard-xs"
                    : "text-ink/80 hover:bg-ink/5 hover:text-ink font-bold border-2 border-transparent"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* "Needs you" count chip: hidden when 0 */}
                {item.needsYouCount > 0 && (
                  <span
                    title={`${item.needsYouCount} items require your action`}
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black rounded-full bg-tomato text-white border border-ink leading-none shadow-hard-xs shrink-0"
                  >
                    {item.needsYouCount}
                  </span>
                )}
              </Link>

              {/* Tasks Sub-links: visible when expanded and count > 0 */}
              {!collapsed && item.subLinks && (
                <div className="pl-6 pr-1 py-1 space-y-1">
                  {item.subLinks.map((sub) => {
                    if (sub.count === 0) return null
                    const SubIcon = sub.icon

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xs text-xs font-semibold text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors border border-transparent hover:border-ink/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SubIcon className="w-3.5 h-3.5 text-ink/50" />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-ink/5 text-ink/80 border border-ink/15 tabular-nums">
                          {sub.count}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Generous spacing break */}
        <div className="pt-4 border-t border-ink/10">
          {/* Quick link: Report from the field (Heatmap Check-in) */}
          <Link
            href="/heatmap"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-black bg-sun/20 border-2 border-ink text-ink shadow-hard-xs hover:bg-sun/40 transition-all"
            title={collapsed ? "Report from the field" : undefined}
          >
            <Radio className="w-4 h-4 text-ink shrink-0 animate-pulse" />
            {!collapsed && <span>Report from the field</span>}
          </Link>
        </div>
      </nav>

      {/* 4. User Menu at the bottom */}
      <UserMenu collapsed={collapsed} />
    </aside>
  )
}
