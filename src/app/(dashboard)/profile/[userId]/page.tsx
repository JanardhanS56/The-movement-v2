import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function ProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteer Profile"
        description={`Public verification ledger and earned badges for member ${params.userId}.`}
      />
      <EmptyState
        title="Volunteer Profile"
        description="No items to show."
      />
    </div>
  )
}
