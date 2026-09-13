import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatCard } from "@/components/shiplync/StatCard";
import { useAdminStats, useShipments, useNotifications, useHubs, useVehicles, useExceptions } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Timer,
  Warehouse,
  IndianRupee,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CHART_COLORS = [
  "oklch(0.52 0.19 258)",
  "oklch(0.72 0.13 195)",
  "oklch(0.68 0.16 155)",
  "oklch(0.78 0.16 75)",
  "oklch(0.62 0.24 15)",
];

function useRealDashboardCharts(shipments: any[]) {
  return useMemo(() => {
    const byDay = new Map<string, { shipments: number; delivered: number }>();
    const byType = new Map<string, number>();
    const byPriority = new Map<string, number>();
    let predictedHoursSum = 0;
    let actualHoursSum = 0;
    let deliveredWithBothCount = 0;

    for (const s of shipments) {
      const day = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
      const dayEntry = byDay.get(day) ?? { shipments: 0, delivered: 0 };
      dayEntry.shipments += 1;
      if (s.status === "delivered") dayEntry.delivered += 1;
      byDay.set(day, dayEntry);

      byType.set(s.packageType, (byType.get(s.packageType) ?? 0) + 1);
      byPriority.set(s.priority, (byPriority.get(s.priority) ?? 0) + 1);

      if (s.status === "delivered" && s.deliveredAt && s.estimatedDeliveryAt) {
        const created = new Date(s.createdAt).getTime();
        const predicted = (new Date(s.estimatedDeliveryAt).getTime() - created) / 36e5;
        const actual = (new Date(s.deliveredAt).getTime() - created) / 36e5;
        predictedHoursSum += predicted;
        actualHoursSum += actual;
        deliveredWithBothCount += 1;
      }
    }

    const volume = Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));
    const categoryMix = Array.from(byType.entries()).map(([name, value]) => ({ name, value }));
    const priorityMix = Array.from(byPriority.entries()).map(([name, value]) => ({ name, value }));
    const avgPredictedHrs = deliveredWithBothCount > 0 ? Math.round((predictedHoursSum / deliveredWithBothCount) * 10) / 10 : 0;
    const avgActualHrs = deliveredWithBothCount > 0 ? Math.round((actualHoursSum / deliveredWithBothCount) * 10) / 10 : 0;

    return { volume, categoryMix, priorityMix, avgPredictedHrs, avgActualHrs, deliveredWithBothCount };
  }, [shipments]);
}

function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: allShipments = [] } = useShipments("all");
  const { data: liveNotifications = [] } = useNotifications();
  const { data: allHubs = [] } = useHubs();
  const { data: allVehicles = [] } = useVehicles();
  const { data: exceptions = [] } = useExceptions();
  const { volume, categoryMix, priorityMix, avgPredictedHrs, avgActualHrs, deliveredWithBothCount } = useRealDashboardCharts(allShipments);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Command center</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Everything moves. All at once.</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border bg-card px-3 py-1.5 text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
            <span className="font-medium">{stats?.active ?? 0} active</span>
            <span className="text-muted-foreground">shipments</span>
          </div>
          <Button size="sm" variant="outline" asChild><a href="/api/reports/shipments.csv">Export report</a></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total shipments" value={String(stats?.total ?? 0)} icon={<Package />} />
        <StatCard label="Delivered today" value={String(stats?.deliveredToday ?? 0)} icon={<CheckCircle2 />} />
        <StatCard label="Active" value={String(stats?.active ?? 0)} delta="Real-time" icon={<Truck />} />
        <StatCard label="Failed / delayed" value={String(stats?.failed ?? 0)} icon={<AlertTriangle />} />
        <StatCard label="Medical" value={String(stats?.medical ?? 0)} icon={<HeartPulse />} />
        <StatCard label="Revenue" value={`₹${(stats?.revenue ?? 0).toLocaleString()}`} icon={<IndianRupee />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-semibold">Hubs & fleet</div>
              <div className="text-xs text-muted-foreground">
                {allHubs.length} hub{allHubs.length === 1 ? "" : "s"} · {allVehicles.length} vehicle{allVehicles.length === 1 ? "" : "s"} — real counts, no live GPS feed is connected
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {allHubs.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">No hubs registered yet.</div>}
            {allHubs.map((h: any) => (
              <div key={h.id}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code} <span className="text-muted-foreground font-normal">· {h.name}, {h.city}</span></div>
                  <div className={`font-mono ${h.loadPct > 85 ? "text-destructive" : h.loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>
                    {h.activeShipmentCount} active · {h.loadPct}%
                  </div>
                </div>
                <Progress value={h.loadPct} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 bg-muted/40">
          <div className="flex items-center gap-2 text-xs font-medium text-primary"><ShieldAlert className="h-3.5 w-3.5" /> Open exceptions</div>
          {exceptions.length === 0 ? (
            <div className="mt-4 text-xs text-muted-foreground">No open exceptions detected. Run detection from Admin → Exceptions.</div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {exceptions.slice(0, 4).map((e: any) => (
                <li key={e.id} className="flex items-start gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full mt-2 ${e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
                  <div>
                    <div className="font-medium capitalize">{e.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{e.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs">
            <Mini l="Open exceptions" v={String(exceptions.length)} />
            <Mini l="Critical" v={String(exceptions.filter((e: any) => e.severity === "critical").length)} />
            <Mini l="Delivered (30d sample)" v={String(deliveredWithBothCount)} />
            <Mini l="Avg predicted ETA" v={`${avgPredictedHrs}h`} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-display font-semibold">Volume trend</div>
              <div className="text-xs text-muted-foreground">Shipments booked vs delivered, by day (real data)</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-success"><TrendingUp className="h-3.5 w-3.5" /> Live</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.19 258)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.52 0.19 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.13 195)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.72 0.13 195)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="shipments" stroke="oklch(0.52 0.19 258)" strokeWidth={2} fill="url(#a1)" />
                <Area type="monotone" dataKey="delivered" stroke="oklch(0.72 0.13 195)" strokeWidth={2} fill="url(#a2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Package mix</div>
          <div className="text-xs text-muted-foreground">Distribution by category (real data)</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                  {categoryMix.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryMix.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 capitalize">{c.name}</span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Warehouse className="h-4 w-4" /> Hub utilization</div>
          <div className="text-xs text-muted-foreground">Active shipments vs capacity (real data)</div>
          <div className="mt-4 space-y-3">
            {allHubs.length === 0 && <div className="text-xs text-muted-foreground">No hubs registered yet.</div>}
            {allHubs.map((h: any) => (
              <div key={h.id}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code}<span className="text-muted-foreground font-normal"> · {h.city}</span></div>
                  <div className={`font-mono ${h.loadPct > 85 ? "text-destructive" : h.loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.loadPct}%</div>
                </div>
                <Progress value={h.loadPct} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Timer className="h-4 w-4" /> ETA accuracy</div>
          <div className="text-xs text-muted-foreground">
            {deliveredWithBothCount > 0
              ? `Avg predicted ${avgPredictedHrs}h vs actual ${avgActualHrs}h, across ${deliveredWithBothCount} delivered shipments`
              : "No delivered shipments with both an ETA and delivery time yet"}
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Line type="monotone" dataKey="delivered" name="Delivered" stroke="oklch(0.52 0.19 258)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Priority mix</div>
          <div className="text-xs text-muted-foreground">Shipments by priority tier (real data)</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="value" fill="oklch(0.68 0.16 155)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="font-display font-semibold">Live shipment feed</div>
              <div className="text-xs text-muted-foreground">Real data, most recent first</div>
            </div>
          </div>
          <div className="divide-y">
            {allShipments.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No shipments yet.</div>}
            {allShipments.slice(0, 12).map((s: any) => (
              <div key={s.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
                <div className="col-span-3">
                  <div className="text-xs font-mono">{s.trackingId}</div>
                  <div className="text-sm font-medium">{s.senderCity} → {s.receiverCity}</div>
                </div>
                <div className="col-span-2 text-xs capitalize">{s.packageType}</div>
                <div className="col-span-3 text-xs text-muted-foreground capitalize">{s.status.replace(/_/g, " ")}</div>
                <div className="col-span-2 text-xs">{s.assignedAgentId ? "Assigned" : "—"}</div>
                <div className="col-span-2 flex justify-end text-xs font-medium">₹{s.cost}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Notifications</div>
          <div className="text-xs text-muted-foreground">Real, event-driven notifications for this account</div>
          <ul className="mt-4 space-y-3">
            {liveNotifications.length === 0 && <div className="text-xs text-muted-foreground">No notifications yet.</div>}
            {liveNotifications.slice(0, 8).map((n: any) => (
              <li key={n.id} className="flex items-start gap-3 rounded-lg border p-3">
                <span className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${
                  n.type === "medical_priority" ? "bg-medical/15 text-medical"
                  : n.type === "delivery_failed" ? "bg-warning/15 text-warning-foreground"
                  : n.type === "delivered" || n.type === "payment_successful" ? "bg-success/15 text-success"
                  : "bg-primary/15 text-primary"
                }`}>
                  {n.type === "medical_priority" ? <HeartPulse className="h-4 w-4" /> : n.type === "delivery_failed" ? <AlertTriangle className="h-4 w-4" /> : n.type === "delivered" ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.message}</div>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Mini({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
      <div className="text-sm font-semibold mt-0.5">{v}</div>
    </div>
  );
}
