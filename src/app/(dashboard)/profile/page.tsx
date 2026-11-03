"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"

export default function BaseProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  React.useEffect(() => {
    if (user?.id) {
      router.replace(`/profile/${user.id}`)
    } else {
      router.replace(`/profile/11111111-1111-4111-8111-111111111111`)
    }
  }, [user, router])

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <ProfileSkeleton />
    </div>
  )
}

