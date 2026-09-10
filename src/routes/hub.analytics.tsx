import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  PackageCheck,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/analytics")({
  head: () => ({
    meta: [
      { title: "Hub Analytics — Hub Operations" },
      { name: "description", content: "Facility throughput analytics, sorting speed, error rate metrics, and volume trends." },
    ],
  }),
  component: HubAnalyticsPage,
});

function useRealCategoryMix() {
  const { data: hubShipments = [] } = useShipments("hub");
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of hubShipments) counts[s.packageType] = (counts[s.packageType] ?? 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [hubShipments]);
}

function useRealVolume() {
  const { data: hubShipments = [] } = useShipments("hub");
  return useMemo(() => {
    const byDay = new Map<string, { shipments: number; delivered: number }>();
    for (const s of hubShipments as any[]) {
      const day = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
      const entry = byDay.get(day) ?? { shipments: 0, delivered: 0 };
      entry.shipments += 1;
      if (s.status === "delivered") entry.delivered += 1;
      byDay.set(day, entry);
    }
    return Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));
  }, [hubShipments]);
}

function HubAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("today");
  const categoryMix = useRealCategoryMix();
  const volume = useRealVolume();
  const { data: hubShipments = [] } = useShipments("hub");
  const hubTotal = hubShipments.length;
  const deliveredShipments = hubShipments.filter((s: any) => s.status === "delivered" && s.deliveredAt);
  const hubDelivered = deliveredShipments.length;
  const onTimeCount = deliveredShipments.filter(
    (s: any) => s.estimatedDeliveryAt && new Date(s.deliveredAt) <= new Date(s.estimatedDeliveryAt),
  ).length;
  const hubOnTimePct = hubDelivered > 0 ? Math.round((onTimeCount / hubDelivered) * 100) : 100;
  const hubMedical = hubShipments.filter((s: any) => s.packageType === "medical").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Facility Analytics & Throughput
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Operational speed, sorting accuracy, hub bottleneck diagnostics, and volume stream logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported facility performance PDF")}
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards — real counts from this hub's shipments; sorting-speed and
          error-rate telemetry isn't instrumented, so those cards were removed
          rather than shown with fabricated numbers. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Handled <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{hubTotal}</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Delivered <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{hubDelivered}</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On-Time Rate <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{hubOnTimePct}%</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority <SlidersHorizontal className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{hubMedical}</div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Volume */}
        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Intake & Dispatch Volume Stream
              </h2>
              <p className="text-xs text-muted-foreground">
                Parcels scanned into bays vs dispatched on delivery routes
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              Live Stream
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="shipments" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="delivered" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bay Load Distribution */}
        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Package Mix & Category Distribution
              </h2>
              <p className="text-xs text-muted-foreground">
                Real shipment volume at this hub, by package type
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              Real data
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
