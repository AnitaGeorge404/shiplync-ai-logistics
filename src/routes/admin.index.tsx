import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatCard } from "@/components/shiplync/StatCard";
import { useAdminStats, useShipments, useNotifications, useHubs, useVehicles, useAgents, useExceptions } from "@/lib/api-hooks";
import { statusLabel } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Warehouse,
  IndianRupee,
  TrendingUp,
  Users,
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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const PIPELINE_STAGES: { key: string; statuses: string[] }[] = [
  { key: "booked", statuses: ["booked", "payment_completed"] },
  { key: "picked_up", statuses: ["picked_up"] },
  { key: "at_hub", statuses: ["arrived_hub"] },
  { key: "in_transit", statuses: ["in_transit"] },
  { key: "out_for_delivery", statuses: ["out_for_delivery"] },
  { key: "delivered", statuses: ["delivered"] },
  { key: "exception", statuses: ["delivery_attempted"] },
  { key: "returned", statuses: ["returned", "cancelled"] },
];

function useDashboardData(shipments: any[]) {
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

    const pipeline = PIPELINE_STAGES.map((stage) => ({
      key: stage.key,
      label: stage.key === "exception" ? "Failed" : statusLabel[stage.key as keyof typeof statusLabel] ?? stage.key,
      count: shipments.filter((s) => stage.statuses.includes(s.status)).length,
    }));
    const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count));

    return { volume, categoryMix, priorityMix, avgPredictedHrs, avgActualHrs, deliveredWithBothCount, pipeline, pipelineMax };
  }, [shipments]);
}

function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: allShipments = [] } = useShipments("all");
  const { data: liveNotifications = [] } = useNotifications();
  const { data: allHubs = [] } = useHubs();
  const { data: allVehicles = [] } = useVehicles();
  const { data: agents = [] } = useAgents();
  const { data: exceptions = [] } = useExceptions();
  const { volume, categoryMix, priorityMix, avgPredictedHrs, avgActualHrs, deliveredWithBothCount, pipeline, pipelineMax } =
    useDashboardData(allShipments);

  const inTransit = allShipments.filter((s: any) => s.status === "in_transit").length;
  const outForDelivery = allShipments.filter((s: any) => s.status === "out_for_delivery").length;
  const criticalExceptions = exceptions.filter((e: any) => e.severity === "critical").length;

  const hubWorkload = allHubs.map((h: any) => {
    const atHub = allShipments.filter((s: any) => s.currentHubId === h.id);
    return {
      ...h,
      incoming: atHub.filter((s: any) => ["picked_up", "in_transit"].includes(s.status)).length,
      processing: atHub.filter((s: any) => s.status === "arrived_hub").length,
      outgoing: atHub.filter((s: any) => s.status === "out_for_delivery").length,
    };
  });

  const deliveryOps = agents.map((a: any) => {
    const assigned = allShipments.filter((s: any) => s.assignedAgentId === a.id);
    const completed = assigned.filter((s: any) => s.status === "delivered").length;
    const failed = assigned.filter((s: any) => s.status === "delivery_attempted").length;
    const active = assigned.filter((s: any) => !["delivered", "cancelled", "returned"].includes(s.status)).length;
    const utilization = assigned.length > 0 ? Math.round((active / assigned.length) * 100) : 0;
    return { ...a, assigned: assigned.length, completed, failed, utilization };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 border-b pb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Operations</div>
          <h1 className="text-2xl font-semibold mt-1">Shipment operations</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border bg-card px-2.5 py-1.5 text-xs flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
            <span className="font-medium">{stats?.active ?? 0}</span>
            <span className="text-muted-foreground">active shipments</span>
          </div>
          <Button size="sm" variant="outline" asChild><a href="/api/reports/shipments.csv">Export report</a></Button>
        </div>
      </div>

      {/* Level 1 — operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Shipments" value={String(stats?.total ?? 0)} icon={<Package />} />
        <StatCard label="In transit" value={String(inTransit)} icon={<Truck />} />
        <StatCard label="Out for delivery" value={String(outForDelivery)} icon={<Package />} />
        <StatCard
          label="Exceptions"
          value={String(exceptions.length)}
          hint={criticalExceptions > 0 ? `${criticalExceptions} critical` : undefined}
          tone={exceptions.length > 0 ? "destructive" : "default"}
          icon={<AlertTriangle />}
        />
      </div>

      {/* Live operational overview */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-elevated p-4">
          <div className="font-semibold text-sm">Shipment pipeline</div>
          <div className="text-xs text-muted-foreground">Current shipment count at each stage</div>
          <div className="mt-4 space-y-2.5">
            {pipeline.map((stage) => (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs text-muted-foreground">{stage.label}</div>
                <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                  <div
                    className={`h-full ${stage.key === "exception" ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${(stage.count / pipelineMax) * 100}%` }}
                  />
                </div>
                <div className="w-10 shrink-0 text-right text-xs font-medium font-mono">{stage.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Exceptions / alerts</div>
          {exceptions.length === 0 ? (
            <div className="mt-4 text-xs text-muted-foreground">No open exceptions.</div>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {exceptions.slice(0, 5).map((e: any) => (
                <li key={e.id} className="flex items-start gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
                  <div className="min-w-0">
                    <div className="font-medium capitalize text-xs">{e.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{e.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
            <Mini l="Critical" v={String(criticalExceptions)} />
            <Mini l="Avg predicted ETA" v={`${avgPredictedHrs}h`} />
          </div>
        </div>
      </div>

      {/* Hub workload */}
      <div className="card-elevated overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold"><Warehouse className="h-3.5 w-3.5" /> Hub workload</div>
          <div className="text-xs text-muted-foreground">{allHubs.length} hub{allHubs.length === 1 ? "" : "s"} · {allVehicles.length} vehicle{allVehicles.length === 1 ? "" : "s"}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-2">Hub</th>
                <th className="text-right font-medium px-4 py-2">Incoming</th>
                <th className="text-right font-medium px-4 py-2">Processing</th>
                <th className="text-right font-medium px-4 py-2">Outgoing</th>
                <th className="text-left font-medium px-4 py-2 w-56">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {hubWorkload.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">No hubs registered yet.</td></tr>
              )}
              {hubWorkload.map((h: any) => (
                <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-xs">{h.code}</div>
                    <div className="text-xs text-muted-foreground">{h.name}, {h.city}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{h.incoming}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{h.processing}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{h.outgoing}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress value={h.loadPct} className="h-1.5 flex-1" />
                      <span className={`font-mono text-xs w-9 text-right ${h.loadPct > 85 ? "text-destructive" : h.loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.loadPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery operations */}
      <div className="card-elevated overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-semibold"><Users className="h-3.5 w-3.5" /> Delivery operations</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-2">Agent</th>
                <th className="text-right font-medium px-4 py-2">Assigned</th>
                <th className="text-right font-medium px-4 py-2">Completed</th>
                <th className="text-right font-medium px-4 py-2">Failed</th>
                <th className="text-left font-medium px-4 py-2 w-44">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOps.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">No delivery agents registered yet.</td></tr>
              )}
              {deliveryOps.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-xs">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.phone}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{a.assigned}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-success">{a.completed}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    <span className={a.failed > 0 ? "text-destructive" : ""}>{a.failed}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress value={a.utilization} className="h-1.5 flex-1" />
                      <span className="font-mono text-xs w-9 text-right text-muted-foreground">{a.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supporting information — trends */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-elevated p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Volume trend</div>
              <div className="text-xs text-muted-foreground">Shipments booked vs. delivered, by day</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> {deliveredWithBothCount} sampled</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="shipments" stroke="var(--chart-1)" strokeWidth={2} fill="url(#a1)" />
                <Area type="monotone" dataKey="delivered" stroke="var(--chart-2)" strokeWidth={2} fill="url(#a2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="text-sm font-semibold">Package mix</div>
          <div className="text-xs text-muted-foreground">Distribution by category</div>
          <div className="h-40 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryMix} dataKey="value" nameKey="name" innerRadius={38} outerRadius={64} paddingAngle={3}>
                  {categoryMix.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {categoryMix.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 capitalize truncate">{c.name}</span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-elevated p-4">
          <div className="text-sm font-semibold">ETA accuracy</div>
          <div className="text-xs text-muted-foreground">
            {deliveredWithBothCount > 0
              ? `Predicted ${avgPredictedHrs}h vs. actual ${avgActualHrs}h avg., across ${deliveredWithBothCount} delivered shipments`
              : "No delivered shipments with both an ETA and delivery time yet"}
          </div>
          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Line type="monotone" dataKey="delivered" name="Delivered" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="text-sm font-semibold">Priority mix</div>
          <div className="text-xs text-muted-foreground">Shipments by priority tier</div>
          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><IndianRupee className="h-3.5 w-3.5" /> Revenue & medical</div>
          <div className="text-xs text-muted-foreground">Real totals from the current shipment set</div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span className="font-semibold">₹{(stats?.revenue ?? 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><HeartPulse className="h-3.5 w-3.5" /> Medical shipments</span><span className="font-semibold">{stats?.medical ?? 0}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Delivered today</span><span className="font-semibold">{stats?.deliveredToday ?? 0}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Failed / delayed</span><span className="font-semibold">{stats?.failed ?? 0}</span></div>
          </div>
        </div>
      </div>

      {/* Tertiary — feed and notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-elevated overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-semibold">Recent shipments</div>
            <div className="text-xs text-muted-foreground">Most recent first</div>
          </div>
          <div className="divide-y">
            {allShipments.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No shipments yet.</div>}
            {allShipments.slice(0, 8).map((s: any) => (
              <div key={s.id} className="grid grid-cols-12 items-center gap-3 px-4 py-2.5 text-xs">
                <div className="col-span-3 font-mono">{s.trackingId}</div>
                <div className="col-span-3">{s.senderCity} → {s.receiverCity}</div>
                <div className="col-span-2 capitalize text-muted-foreground">{s.packageType}</div>
                <div className="col-span-2 text-muted-foreground capitalize">{s.status.replace(/_/g, " ")}</div>
                <div className="col-span-2 text-right font-medium">₹{s.cost}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="text-sm font-semibold">Notifications</div>
          <ul className="mt-3 space-y-2.5">
            {liveNotifications.length === 0 && <div className="text-xs text-muted-foreground">No notifications yet.</div>}
            {liveNotifications.slice(0, 6).map((n: any) => (
              <li key={n.id} className="flex items-start gap-2.5 text-xs">
                <span className={`h-6 w-6 rounded-md grid place-items-center shrink-0 ${
                  n.type === "medical_priority" ? "bg-medical/10 text-medical"
                  : n.type === "delivery_failed" ? "bg-warning/10 text-warning-foreground"
                  : n.type === "delivered" || n.type === "payment_successful" ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {n.type === "medical_priority" ? <HeartPulse className="h-3.5 w-3.5" /> : n.type === "delivery_failed" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-muted-foreground">{n.message}</div>
                </div>
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
    <div className="rounded-md border bg-card p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
      <div className="text-sm font-semibold mt-0.5">{v}</div>
    </div>
  );
}
