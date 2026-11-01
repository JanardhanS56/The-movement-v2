"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { Monogram } from "@/components/shared/Monogram"
import { Button } from "@/components/ui/button"
import { UserTier } from "@/lib/schemas/user.schema"
import { CreateMovementDialog } from "./CreateMovementDialog"
import {
  Megaphone,
  MapPin,
  CheckSquare,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut, openDemoDrawer } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  const navItems = [
    {
      label: "Feed",
      href: "/feed",
      icon: Megaphone,
    },
    {
      label: "Heatmap",
      href: "/heatmap",
      icon: MapPin,
    },
    {
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      label: "My Profile",
      href: user ? `/profile/${user.id}` : "/sign-in",
      icon: UserIcon,
    },
  ]

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={`hidden md:flex flex-col border-r-2 border-ink bg-ivory transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b-2 border-ink">
        {!collapsed && (
          <Link
            href="/feed"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
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
          className="ml-auto text-ink hover:bg-ink/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Sidebar Links" className="flex-1 py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-lime text-ink font-bold border-2 border-ink shadow-hard-sm"
                  : "text-ink/80 hover:bg-ink/5 hover:text-ink font-semibold border-2 border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {!collapsed && user?.tier === 3 && (
          <div className="pt-3">
            <CreateMovementDialog />
          </div>
        )}
      </nav>

      {/* User Footer Profile & Sign Out */}
      {user && (
        <div className="p-3 border-t-2 border-ink bg-white/50">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink truncate">
                    {user.display_name}
                  </p>
                  <TierBadge
                    tier={user.tier as UserTier}
                    showIcon={false}
                    className="text-xs py-0 px-1 mt-0.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="w-full text-xs h-8 gap-2 border border-ink text-ink hover:bg-tomato hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign out</span>
                </Button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-ink/70 border-t border-ink/10">
                <button
                  type="button"
                  onClick={openDemoDrawer}
                  className="hover:text-ink font-bold underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Wrench className="h-3 w-3" aria-hidden="true" />
                  <span>Demo tools</span>
                </button>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-lime text-ink font-bold text-xs border border-ink">
                  Demo data
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} className="h-7 w-7" />
              <button
                type="button"
                onClick={openDemoDrawer}
                aria-label="Open demo tools"
                className="p-1 rounded text-ink hover:bg-ink/10"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={signOut}
                aria-label="Sign out of demo session"
                className="text-ink hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
