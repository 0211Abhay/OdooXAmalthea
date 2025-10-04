import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const StatCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-12 w-12 rounded-lg" />
    </div>
  </Card>
);

export const ExpenseCardSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  </Card>
);

export const TableSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          {[1, 2, 3, 4, 5].map((j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </Card>
);
