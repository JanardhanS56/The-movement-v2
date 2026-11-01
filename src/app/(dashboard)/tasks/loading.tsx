import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6 space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full rounded-sm" />
        <Skeleton className="h-40 w-full rounded-sm" />
        <Skeleton className="h-40 w-full rounded-sm" />
        <Skeleton className="h-40 w-full rounded-sm" />
      </div>
    </div>
  )
}
