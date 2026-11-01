"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"

export default function BaseProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  React.useEffect(() => {
    if (user?.id) {
      router.replace(`/profile/${user.id}`)
    } else if (!isAuthenticated) {
      router.replace("/sign-in")
    }
  }, [user, isAuthenticated, router])

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <ProfileSkeleton />
    </div>
  )
}
