import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useShipments, useHubs, useUsers, usePayments } from "@/lib/api-hooks";
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
import { LineChart as LineChartIcon } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Admin Command Center" },
      { name: "description", content: "Shipment volume, delivery outcomes, hub/agent utilization and revenue, computed from live data." },
    ],
  }),
  component: AdminAnalyticsPage,
});

const ACTIVE_STATUSES = ["picked_up", "arrived_hub", "in_transit", "out_for_delivery", "delivery_attempted"];

function useAnalyticsData() {
  const { data: shipments = [] } = useShipments("all");
  const { data: hubs = [] } = useHubs();
  const { data: users = [] } = useUsers();
  const { data: payments = [] } = usePayments("all");

  return useMemo(() => {
    const byDay = new Map<string, { volume: number; delivered: number }>();
    for (const s of shipments as any[]) {
      const day = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
      const entry = byDay.get(day) ?? { volume: 0, delivered: 0 };
      entry.volume += 1;
      if (s.status === "delivered") entry.delivered += 1;
      byDay.set(day, entry);
    }
    const volume = Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));

    const delivered = (shipments as any[]).filter((s) => s.status === "delivered").length;
    const failed = (shipments as any[]).filter((s) => s.status === "returned" || s.status === "cancelled").length;
    const resolved = delivered + failed;
    const completionRate = resolved > 0 ? Math.round((delivered / resolved) * 100) : 0;
    const failureRate = resolved > 0 ? Math.round((failed / resolved) * 100) : 0;

    const hubUtilization = (hubs as any[]).map((h) => ({ name: h.code, value: h.loadPct ?? 0 }));

    const agents = (users as any[]).filter((u) => u.role === "delivery_agent");
    const agentUtilization = agents
      .map((a) => {
        const assigned = (shipments as any[]).filter((s) => s.assignedAgentId === a.id);
        const pending = assigned.filter((s) => ACTIVE_STATUSES.includes(s.status)).length;
        return { name: a.name.split(" ")[0], value: assigned.length > 0 ? Math.round((pending / assigned.length) * 100) : 0 };
      })
      .slice(0, 8);

    const byDayRevenue = new Map<string, number>();
    for (const p of payments as any[]) {
      if (p.status !== "paid") continue;
      const day = new Date(p.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
      byDayRevenue.set(day, (byDayRevenue.get(day) ?? 0) + p.amount);
    }
    const revenue = Array.from(byDayRevenue.entries()).map(([day, value]) => ({ day, value }));

    return { volume, completionRate, failureRate, hubUtilization, agentUtilization, revenue, delivered, failed };
  }, [shipments, hubs, users, payments]);
}

function AdminAnalyticsPage() {
  const { volume, completionRate, failureRate, hubUtilization, agentUtilization, revenue, delivered, failed } = useAnalyticsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real operational metrics computed from the live database — no synthetic or placeholder series.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Delivery completion</div>
          <div className="text-2xl font-semibold mt-2 text-success">{completionRate}%</div>
          <div className="text-[11px] text-muted-foreground mt-1">{delivered} delivered</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Failed delivery rate</div>
          <div className="text-2xl font-semibold mt-2">{failureRate}%</div>
          <div className="text-[11px] text-muted-foreground mt-1">{failed} returned / cancelled</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Hubs tracked</div>
          <div className="text-2xl font-semibold mt-2">{hubUtilization.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Agents tracked</div>
          <div className="text-2xl font-semibold mt-2">{agentUtilization.length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-5 bg-card">
          <div className="flex items-center gap-2 text-sm font-semibold"><LineChartIcon className="h-4 w-4" /> Shipment volume</div>
          <div className="text-xs text-muted-foreground">Booked vs. delivered, by day</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="volume" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.12} />
                <Area type="monotone" dataKey="delivered" stroke="var(--chart-3)" strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-card">
          <div className="text-sm font-semibold">Revenue</div>
          <div className="text-xs text-muted-foreground">Paid transactions, by day</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-5 bg-card">
          <div className="text-sm font-semibold">Hub utilization</div>
          <div className="text-xs text-muted-foreground">Active shipments vs. capacity, per hub</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hubUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} formatter={(v: any) => [`${v}%`, "Load"]} />
                <Bar dataKey="value" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-card">
          <div className="text-sm font-semibold">Agent utilization</div>
          <div className="text-xs text-muted-foreground">Share of each agent's assignments still in progress</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
                <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} formatter={(v: any) => [`${v}%`, "Load"]} />
                <Bar dataKey="value" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
