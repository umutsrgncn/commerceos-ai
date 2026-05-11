import { SkeletonHero, SkeletonTable } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHero />
      <SkeletonTable rows={8} />
    </div>
  );
}
