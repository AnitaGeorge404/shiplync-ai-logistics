import type { ShipmentStatus } from "@/lib/mock-data";
import { statusLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<ShipmentStatus, string> = {
  booked: "bg-muted text-muted-foreground border-border",
  picked_up: "bg-info/10 text-info border-info/20",
  at_hub: "bg-info/10 text-info border-info/20",
  in_transit: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-warning/15 text-warning-foreground border-warning/30",
  delivered: "bg-success/15 text-success-foreground border-success/30",
  exception: "bg-destructive/10 text-destructive border-destructive/20",
  returned: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", styles[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
      {statusLabel[status]}
    </span>
  );
}
