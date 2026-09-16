import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useShipments } from "@/lib/api-hooks";
import type { RealShipment } from "@/lib/driver";
import { CheckCircle2, Smile, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/driver/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Delivery Partner" },
      {
        name: "description",
        content:
          "On-time delivery rate and completed drop count, computed from your real delivery history.",
      },
    ],
  }),
  component: DriverPerformancePage,
});

function DriverPerformancePage() {
  const { user } = useAuth();
  const { data: assigned = [] } = useShipments("assigned") as { data: RealShipment[] };
  const delivered = assigned.filter((s) => s.status === "delivered" && s.deliveredAt);
  const onTime = delivered.filter(
    (s) => s.estimatedDeliveryAt && new Date(s.deliveredAt!) <= new Date(s.estimatedDeliveryAt),
  );
  const onTimePct =
    delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 100;
  const medicalDelivered = delivered.filter((s) => s.packageType === "medical");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-base grid place-items-center shrink-0">
          {(user?.name ?? "DP")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <div className="font-display font-semibold text-lg">
            {user?.name ?? "Delivery Partner"}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Partner ID {user?.id?.slice(0, 8) ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On-time delivery <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{onTimePct}%</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {delivered.length} delivered, real data
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Completed <Smile className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{delivered.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            of {assigned.length} assigned
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical drops <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalDelivered.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">real data</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            EV efficiency <Zap className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">14.2 km/kWh</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Illustrative — no vehicle telemetry yet
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-card text-xs text-muted-foreground">
        Customer ratings aren't implemented yet — this scorecard shows only real, computed delivery
        data.
      </div>
    </div>
  );
}
