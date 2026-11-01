import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements Feed"
        description="Multi-signature verified dispatches and movement directives."
      />
      <EmptyState
        title="Announcements Feed"
        description="No items to show."
      />
    </div>
  )
}
