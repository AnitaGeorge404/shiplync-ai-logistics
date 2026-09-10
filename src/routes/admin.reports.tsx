import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useShipments, useAdminStats } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  IndianRupee,
  CheckCircle2,
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

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Admin Dashboard" },
      { name: "description", content: "Real delivery volume, package mix, and exportable shipment data from the live database." },
    ],
  }),
  component: AdminReportsPage,
});

function useRealCharts() {
  const { data: shipments = [] } = useShipments("all");
  return useMemo(() => {
    const byDay = new Map<string, { booked: number; delivered: number }>();
    const byType = new Map<string, number>();
    for (const s of shipments as any[]) {
      const day = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
      const entry = byDay.get(day) ?? { booked: 0, delivered: 0 };
      entry.booked += 1;
      if (s.status === "delivered") entry.delivered += 1;
      byDay.set(day, entry);
      byType.set(s.packageType, (byType.get(s.packageType) ?? 0) + 1);
    }
    const volume = Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));
    const categoryMix = Array.from(byType.entries()).map(([name, value]) => ({ name, value }));
    return { volume, categoryMix };
  }, [shipments]);
}

function AdminReportsPage() {
  const { data: stats } = useAdminStats();
  const { volume, categoryMix } = useRealCharts();
  const onTimeRate = stats && stats.total > 0 ? Math.round(((stats.total - stats.failed) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real delivery volume, package mix, and exportable data from the live database.
          </p>
        </div>

        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" asChild>
          <a href="/api/reports/shipments.csv">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export shipments (CSV)
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Shipments <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats?.total ?? 0}</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Non-Failed Rate <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{onTimeRate}%</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Avg Delivery Time <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats?.avgDeliveryHours ?? 0} hrs</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Revenue <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{(stats?.revenue ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Delivery Volume & Outcomes
              </h2>
              <p className="text-xs text-muted-foreground">Booked vs delivered, by day of week (real data)</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              <TrendingUp className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="booked" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="delivered" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Package Mix
              </h2>
              <p className="text-xs text-muted-foreground">Shipments by package type (real data)</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">Live</Badge>
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

      <div className="border rounded-lg p-5 bg-card text-xs text-muted-foreground">
        PDF/Excel report generation and a saved report archive aren't implemented yet — CSV export above is the real,
        live export. Everything on this page is computed from the current database, not cached or pre-generated.
      </div>
    </div>
  );
}
