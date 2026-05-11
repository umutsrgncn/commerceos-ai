import {
  SkeletonCard,
  SkeletonHero,
  SkeletonStatRow,
} from "@/components/ui/skeleton";

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHero />
      <SkeletonStatRow count={4} />
      <SkeletonCard rows={6} />
      <SkeletonCard rows={4} />
    </div>
  );
}
