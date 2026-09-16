import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  hint?: string;
  tone?: "default" | "warning" | "destructive";
};

const TONE_VALUE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning-foreground",
  destructive: "text-destructive",
};

export function StatCard({ label, value, delta, trend = "up", icon, hint, tone = "default" }: Props) {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        {icon && <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className={`text-2xl font-semibold tracking-tight ${TONE_VALUE[tone]}`}>{value}</div>
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
