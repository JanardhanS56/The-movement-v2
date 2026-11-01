"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { TierBadge } from "@/components/shared/TierBadge"
import { Button } from "@/components/ui/button"
import { UserTier } from "@/lib/schemas/user.schema"
import {
  Megaphone,
  MapPin,
  CheckSquare,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
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
      className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <Link
            href="/feed"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-bold text-base tracking-tight text-foreground">
              The Movement
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Sidebar Links" className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-primary/10 text-foreground font-semibold border-l-4 border-l-primary"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border-l-4 border-l-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto text-[10px] font-mono tracking-widest text-primary-light uppercase">
                  [ACTIVE]
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile & Sign Out */}
      {user && (
        <div className="p-3 border-t border-border bg-card/60">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.display_name}
                  </p>
                  <TierBadge
                    tier={user.tier as UserTier}
                    showIcon={false}
                    className="text-[10px] py-0 px-1 mt-0.5"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="w-full text-xs h-8 gap-2 border-border text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </Button>
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <Link
                  href="/privacy"
                  className="hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link
                  href="/terms"
                  className="hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} className="h-7 w-7" />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={signOut}
                aria-label="Sign out of demo session"
                className="text-muted-foreground hover:text-destructive"
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
