import {
  SkeletonHero,
  SkeletonStatRow,
  SkeletonTable,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHero />
      <SkeletonStatRow count={4} />
      <SkeletonTable rows={6} />
    </div>
  );
}
