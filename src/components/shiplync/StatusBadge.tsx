import type { ShipmentStatus } from "@/lib/mock-data";
import { statusLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Canonical ShipLync status language — the same colors and labels are used
// everywhere a shipment status appears (tables, cards, timelines, filters).
const styles: Record<ShipmentStatus, string> = {
  booked: "bg-muted text-muted-foreground border-border",
  picked_up: "bg-info/10 text-info border-info/25",
  at_hub: "bg-info/10 text-info border-info/25",
  in_transit: "bg-primary/10 text-primary border-primary/25",
  out_for_delivery: "bg-warning/10 text-warning-foreground border-warning/25",
  delivered: "bg-success/10 text-success-foreground border-success/25",
  exception: "bg-destructive/10 text-destructive border-destructive/25",
  returned: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
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
