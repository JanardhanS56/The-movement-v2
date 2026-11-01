import { Skeleton } from "@/components/ui/skeleton"

export default function HeatmapLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-[450px] w-full rounded-sm" />
    </div>
  )
}
