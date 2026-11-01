import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bounty Board"
        description="Community tasks and bounties verified through peer consensus."
      />
      <EmptyState
        title="Bounty Board"
        description="No items to show."
      />
    </div>
  )
}
