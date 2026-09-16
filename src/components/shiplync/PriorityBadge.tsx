import { cn } from "@/lib/utils";

// Semantic priority treatment shared across Dispatch, the Priority Queue,
// Transfers, and Shipment Detail — same colors and labels everywhere a
// shipment's `priority` field is shown.
const styles: Record<string, string> = {
  normal: "bg-muted text-muted-foreground border-border",
  high: "bg-warning/10 text-warning-foreground border-warning/25",
  critical: "bg-destructive/10 text-destructive border-destructive/25",
};

const labels: Record<string, string> = {
  normal: "Normal",
  high: "High priority",
  critical: "Critical",
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        styles[priority] ?? styles.normal,
        className,
      )}
    >
      {priority === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />}
      {labels[priority] ?? priority}
    </span>
  );
}
