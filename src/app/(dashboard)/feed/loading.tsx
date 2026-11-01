import { Skeleton } from "@/components/ui/skeleton"

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-sm" />
        <Skeleton className="h-32 w-full rounded-sm" />
        <Skeleton className="h-32 w-full rounded-sm" />
      </div>
    </div>
  )
}
