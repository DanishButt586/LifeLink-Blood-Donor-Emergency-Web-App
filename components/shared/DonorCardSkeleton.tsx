import { Skeleton } from "@/components/ui/Skeleton";

export function DonorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
