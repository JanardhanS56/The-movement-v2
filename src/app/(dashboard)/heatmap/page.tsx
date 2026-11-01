import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function HeatmapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Check-in Heatmap"
        description="Geographic volunteer density distribution across active sectors."
      />
      <EmptyState
        title="Live Check-in Heatmap"
        description="No items to show."
      />
    </div>
  )
}
