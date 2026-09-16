import { AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, priorityTier, type RealShipment } from "@/lib/driver";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  success: "bg-success/15 text-success-foreground border-success/30",
};

export function StatusTag({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      {STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

// Restrained priority treatment: a short text badge, not a glowing/animated
// element — recognizable at a glance without making the list feel chaotic.
export function PriorityTag({
  shipment,
  className,
}: {
  shipment: Pick<RealShipment, "priority" | "packageType" | "elderlyCare">;
  className?: string;
}) {
  const tier = priorityTier(shipment);
  if (!tier) return null;
  if (tier === "critical") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-medical/30 bg-medical/10 text-medical px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap",
          className,
        )}
      >
        <AlertTriangle className="h-3 w-3" /> CRITICAL
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/15 text-warning-foreground px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap",
        className,
      )}
    >
      <Flame className="h-3 w-3" /> PRIORITY
    </span>
  );
}
