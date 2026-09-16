import { cn } from "@/lib/utils";

type Item = { label: string; value: number; tone?: "neutral" | "warning" | "danger" | "success" };

const TONE_TEXT: Record<string, string> = {
  neutral: "text-foreground",
  warning: "text-warning-foreground",
  danger: "text-destructive",
  success: "text-success",
};

// Dense, scannable operational strip — "what do I need to do today" at a
// glance, not five separate decorative cards.
export function OverviewStrip({ items }: { items: Item[] }) {
  return (
    <div
      className="grid border rounded-lg bg-card divide-x overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => (
        <div key={it.label} className="px-2.5 py-3 text-center">
          <div
            className={cn(
              "font-display text-xl font-semibold leading-none",
              TONE_TEXT[it.tone ?? "neutral"],
            )}
          >
            {it.value}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
