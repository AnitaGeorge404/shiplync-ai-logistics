import type { LucideIcon } from "lucide-react";
import { Package, PackageCheck, Warehouse, Truck, Navigation, CheckCircle2 } from "lucide-react";

type Step = { key: string; label: string; icon: LucideIcon; matches: string[] };

// Canonical milestone sequence, in the order the real shipment_status enum
// actually progresses through (booked -> picked up -> hub -> transit ->
// out for delivery -> delivered). "Done" is derived from the shipment's
// current status plus its real event history, never simulated.
const STEPS: Step[] = [
  { key: "booked", label: "Booked", icon: Package, matches: ["booked", "payment_completed"] },
  { key: "picked_up", label: "Picked up", icon: PackageCheck, matches: ["picked_up"] },
  { key: "at_hub", label: "At hub", icon: Warehouse, matches: ["arrived_hub"] },
  { key: "in_transit", label: "In transit", icon: Truck, matches: ["in_transit"] },
  { key: "out_for_delivery", label: "Out for delivery", icon: Navigation, matches: ["out_for_delivery", "delivery_attempted"] },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, matches: ["delivered"] },
];

function rankOf(status: string) {
  return STEPS.findIndex((s) => s.matches.includes(status));
}

export function ShipmentMilestones({ status, events }: { status: string; events: { status: string }[] }) {
  const statusesSeen = [status, ...events.map((e) => e.status)];
  const reachedRank = Math.max(-1, ...statusesSeen.map(rankOf));
  const pct = reachedRank <= 0 ? 0 : (reachedRank / (STEPS.length - 1)) * 100;

  return (
    <div className="relative pt-1">
      <div className="absolute left-4 right-4 top-5 h-0.5 bg-border overflow-hidden rounded-full">
        <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const done = i <= reachedRank;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 min-w-0" style={{ width: `${100 / STEPS.length}%` }}>
              <div
                className={`h-8 w-8 rounded-full grid place-items-center border-2 shrink-0 ${
                  done ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className={`text-[10px] sm:text-[11px] font-medium text-center leading-tight ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
