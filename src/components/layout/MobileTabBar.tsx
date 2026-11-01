"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Megaphone, MapPin, CheckSquare, User as UserIcon } from "lucide-react"

export function MobileTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
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
      label: "Profile",
      href: user ? `/profile/${user.id}` : "/sign-in",
      icon: UserIcon,
    },
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2"
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative ${
              isActive
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground font-normal"
            }`}
          >
            {/* Active Indicator Shape */}
            {isActive && (
              <span
                className="absolute top-0 h-1 w-8 rounded-b-sm bg-primary"
                aria-hidden="true"
              />
            )}
            <Icon className="h-4 w-4 mb-1" aria-hidden="true" />
            <span className="text-[11px] tracking-tight">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
