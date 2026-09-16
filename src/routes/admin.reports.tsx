import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useShipments, useAdminStats, usePayments } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      { title: "Reports — Admin Dashboard" },
      { name: "description", content: "Shipment, delivery and revenue reports — exportable, real data from the live database." },
    ],
  }),
  component: AdminReportsPage,
});

function useRealCharts() {
  const { data: shipments = [] } = useShipments("all");
  const { data: payments = [] } = usePayments("all");
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

    const delivered = (shipments as any[]).filter((s) => s.status === "delivered").length;
    const failed = (shipments as any[]).filter((s) => s.status === "returned" || s.status === "cancelled").length;
    const inProgress = (shipments as any[]).filter((s) => !["delivered", "returned", "cancelled"].includes(s.status)).length;

    const paymentStatusCounts = (payments as any[]).reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});

    return { volume, categoryMix, delivered, failed, inProgress, paymentStatusCounts };
  }, [shipments, payments]);
}

function AdminReportsPage() {
  const { data: stats } = useAdminStats();
  const { volume, categoryMix, delivered, failed, inProgress, paymentStatusCounts } = useRealCharts();
  const onTimeRate = stats && stats.total > 0 ? Math.round(((stats.total - stats.failed) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Shipment, delivery and revenue reports — computed live from the database, exportable as CSV.
          </p>
        </div>

        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" asChild>
          <a href="/api/reports/shipments.csv">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export shipments (CSV)
          </a>
        </Button>
      </div>

      <Tabs defaultValue="shipments">
        <TabsList>
          <TabsTrigger value="shipments" className="text-xs">Shipment reports</TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs">Delivery reports</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                Total Shipments <BarChart3 className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold mt-2">{stats?.total ?? 0}</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                Non-Failed Rate <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold mt-2">{onTimeRate}%</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                Avg Delivery Time <Clock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold mt-2">{stats?.avgDeliveryHours ?? 0} hrs</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                Medical Shipments <IndianRupee className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold mt-2">{stats?.medical ?? 0}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border rounded-lg p-5 bg-card space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-semibold">Delivery Volume &amp; Outcomes</h2>
                  <p className="text-xs text-muted-foreground">Booked vs. delivered, by day of week</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-normal"><TrendingUp className="h-3 w-3 mr-1" /> Live</Badge>
              </div>
              <div className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="booked" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.12} />
                    <Area type="monotone" dataKey="delivered" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border rounded-lg p-5 bg-card space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-semibold">Package Mix</h2>
                  <p className="text-xs text-muted-foreground">Shipments by package type</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-normal">Live</Badge>
              </div>
              <div className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryMix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium">Delivered</div>
              <div className="text-2xl font-semibold mt-2 text-success">{delivered}</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium">In progress</div>
              <div className="text-2xl font-semibold mt-2">{inProgress}</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium">Failed / returned</div>
              <div className="text-2xl font-semibold mt-2 text-destructive">{failed}</div>
            </div>
          </div>
          <div className="border rounded-lg p-5 bg-card text-xs text-muted-foreground">
            Per-agent delivery performance (assigned, completed, pending, failed, success rate) is broken out on the{" "}
            <a href="/admin/agents" className="text-primary hover:underline">Agents</a> page.
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                Total Revenue <IndianRupee className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold mt-2">₹{(stats?.revenue ?? 0).toLocaleString()}</div>
            </div>
            {Object.entries(paymentStatusCounts).map(([status, count]) => (
              <div key={status} className="border rounded-lg p-4 bg-card">
                <div className="text-xs text-muted-foreground font-medium capitalize">{status} transactions</div>
                <div className="text-2xl font-semibold mt-2">{count as number}</div>
              </div>
            ))}
          </div>
          <div className="border rounded-lg p-5 bg-card text-xs text-muted-foreground">
            Full transaction-level detail, refund logs and per-transaction export are on the{" "}
            <a href="/admin/payments" className="text-primary hover:underline">Payments</a> page.
          </div>
        </TabsContent>
      </Tabs>

      <div className="border rounded-lg p-5 bg-card text-xs text-muted-foreground">
        PDF/Excel report generation and a saved report archive aren't implemented yet — CSV export above is the real,
        live export. Everything on this page is computed from the current database, not cached or pre-generated.
      </div>
    </div>
  );
}
