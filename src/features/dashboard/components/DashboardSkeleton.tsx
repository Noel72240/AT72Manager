import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-0">
          <Skeleton className="h-64 rounded-xl" />
        </Card>
        <Card className="lg:col-span-2 p-0">
          <Skeleton className="h-64 rounded-xl" />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
