import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/PageHeader"
import { ProfileView } from "@/components/profile/ProfileView"

export async function generateMetadata({
  params,
}: {
  params: { userId: string }
}): Promise<Metadata> {
  const shortId = params.userId.length > 8 ? params.userId.slice(0, 8) : params.userId
  return {
    title: `Volunteer Profile (${shortId}) | The Movement`,
    description: `Public verification ledger, earned badges, and community action record for volunteer ${params.userId}.`,
  }
}

/**
 * Server Component page shell providing primary h1 landmark and unique metadata.
 * Note: Data fetching is delegated to the client component ProfileView via TanStack Query
 * because the mock store operates in-memory in the client browser during prototype testing.
 * When real Supabase credentials and database tables exist, this page will switch directly
 * to React Server Components (RSC) to fetch profile, badges, and ledger server-side without SSR crashes.
 * Stale seed data is not rendered statically on the server.
 */
export default function ProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteer Profile"
        description="Public verification ledger, earned badges, and community recognition record."
      />
      <ProfileView userId={params.userId} />
    </div>
  )
}
