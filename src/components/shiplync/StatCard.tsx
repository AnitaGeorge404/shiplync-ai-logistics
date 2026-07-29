import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  hint?: string;
  accent?: string;
};

export function StatCard({ label, value, delta, trend = "up", icon, hint, accent }: Props) {
  return (
    <div className="card-elevated p-5 relative overflow-hidden group">
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: accent ?? "linear-gradient(90deg, oklch(var(--primary)), oklch(var(--accent)))" }}
      />
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        {icon && <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <div
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
            {delta}
          </div>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
