import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { analytics } from "@/lib/mock-data";
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

function HubAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("today");

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Hourly Throughput <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">342 / hr</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +14% peak efficiency
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Avg Sorting Speed <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">1.4s / parcel</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            −0.3s laser scan decoding
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Dispatched On-Time <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">98.2%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +0.8% SLA compliance
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Sorting Error Rate <SlidersHorizontal className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">0.04%</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Only 1 mis-sort out of 2,400
          </div>
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
              <AreaChart data={analytics.volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                Sorting volume categorized by parcel tier
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              Categorized
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryMix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
