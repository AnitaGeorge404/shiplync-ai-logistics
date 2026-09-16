import type { ShipmentStatus } from "@/lib/mock-data";
import { statusLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Canonical ShipLync status language — the same colors and labels are used
// everywhere a shipment status appears (tables, cards, timelines, filters).
const styles: Record<ShipmentStatus, string> = {
  booked: "bg-muted/70 text-foreground border-border font-medium",
  picked_up: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30 font-medium",
  at_hub: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30 font-medium",
  in_transit: "bg-primary/15 text-primary border-primary/30 font-medium",
  out_for_delivery: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold",
  delivered: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-semibold",
  exception: "bg-destructive/15 text-destructive border-destructive/30 font-medium",
  returned: "bg-muted/70 text-foreground border-border font-medium",
  cancelled: "bg-muted/70 text-muted-foreground border-border font-medium",
};

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      {statusLabel[status]}
    </span>
  );
}
