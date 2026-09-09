import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useShipments } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Star,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Award,
  Sparkles,
  Smile,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/performance")({
  head: () => ({
    meta: [
      { title: "Performance & Rating — Delivery Partner" },
      { name: "description", content: "Driver rating scorecard, SLA compliance rate, customer reviews, and achievement badges." },
    ],
  }),
  component: DriverPerformancePage,
});

function DriverPerformancePage() {
  const { user } = useAuth();
  const { data: assigned = [] } = useShipments("assigned");
  const delivered = assigned.filter((s: any) => s.status === "delivered" && s.deliveredAt);
  const onTime = delivered.filter(
    (s: any) => s.estimatedDeliveryAt && new Date(s.deliveredAt) <= new Date(s.estimatedDeliveryAt),
  );
  const onTimePct = delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 100;
  const medicalDelivered = delivered.filter((s: any) => s.packageType === "medical");
  const driver = { name: user?.name ?? "Delivery Partner", id: user?.id?.slice(0, 8) ?? "—", vehicle: "EV Bike" };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Performance Scorecard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your delivery accuracy, customer ratings, fuel efficiency, and tier rewards.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono gap-1 border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
          <Star className="h-3.5 w-3.5 fill-emerald-600" /> TIER 1 TOP RIDER
        </Badge>
      </div>

      {/* Driver Profile Hero Card */}
      <div className="border rounded-xl p-5 bg-card flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-bold text-lg grid place-items-center shrink-0">
            RK
          </div>
          <div>
            <div className="font-display font-bold text-xl text-foreground">{driver.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              Partner ID: {driver.id} · Vehicle: {driver.vehicle}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold mt-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>4.92 / 5.0 Rating</span>
              <span className="text-muted-foreground font-normal">(812 Total Deliveries)</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.info("Performance report generated")}
        >
          <Award className="h-3.5 w-3.5" /> View Tier Benefits
        </Button>
      </div>

      {/* Scorecard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On-Time Delivery SLA <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{onTimePct}%</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">{delivered.length} deliveries, real data</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Delivered <Smile className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{delivered.length}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">of {assigned.length} assigned</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            EV Efficiency <Zap className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">14.2 km/kWh</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Illustrative — no telemetry yet</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Deliveries <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalDelivered.length}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">real data</div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-3 pt-2">
        <h2 className="font-display text-base font-semibold text-foreground">
          Recent Customer Feedback
        </h2>
        <div className="border rounded-lg p-4 bg-card text-xs text-muted-foreground">
          No review/rating system is implemented yet — this section is illustrative only.
        </div>
      </div>
    </div>
  );
}
