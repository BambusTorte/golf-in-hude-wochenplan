import type { PlanStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/plan/labels";
import { cn } from "@/lib/utils";

const STYLES: Record<PlanStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  REVIEW: "bg-sky-100 text-sky-800",
  PUBLISHED: "bg-accent-300/40 text-brand-800",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: PlanStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
