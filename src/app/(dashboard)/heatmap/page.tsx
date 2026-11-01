import { PageHeader } from "@/components/shared/PageHeader"
import { HeatmapView } from "@/components/heatmap/HeatmapView"

export default function HeatmapPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div id="heatmap-heading" tabIndex={-1} className="outline-none">
        <PageHeader
          title="Live Check-in Heatmap"
          description="Geographic volunteer density distribution across active sectors."
        />
      </div>
      <HeatmapView />
    </div>
  )
}
