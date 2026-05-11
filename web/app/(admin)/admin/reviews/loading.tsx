import { SkeletonCard, SkeletonHero } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHero />
      <div className="grid gap-3 lg:grid-cols-2">
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
      </div>
    </div>
  );
}
