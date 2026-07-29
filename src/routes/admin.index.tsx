import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { analytics, hubs, notifications, shipments } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, AlertTriangle, HeartPulse, Timer, Warehouse, IndianRupee, Sparkles, Leaf, TrendingUp } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
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

// Fleet plotted as glowing dots on a stylized India silhouette
const fleetDots = [
  { x: 22, y: 32, v: "EV Van" },
  { x: 35, y: 55, v: "Truck" },
  { x: 48, y: 66, v: "Bike" },
  { x: 55, y: 78, v: "EV Van" },
  { x: 68, y: 60, v: "Truck" },
  { x: 74, y: 44, v: "Bike" },
  { x: 42, y: 40, v: "EV Van" },
  { x: 30, y: 72, v: "Bike" },
  { x: 60, y: 84, v: "Truck" },
  { x: 80, y: 72, v: "EV Van" },
  { x: 52, y: 25, v: "Truck" },
  { x: 66, y: 18, v: "Bike" },
];

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Command center · Nationwide</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Everything moves. All at once.</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border bg-card px-3 py-1.5 text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
            <span className="font-medium">1,284 active</span>
            <span className="text-muted-foreground">shipments · 214 vehicles</span>
          </div>
          <Button size="sm" variant="outline">Export report</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total shipments" value="24,819" delta="+8.4%" icon={<Package />} />
        <StatCard label="Delivered today" value="3,712" delta="+412" icon={<CheckCircle2 />} />
        <StatCard label="Active" value="1,284" delta="Real-time" icon={<Truck />} />
        <StatCard label="Failed" value="42" delta="−12" trend="down" icon={<AlertTriangle />} accent="linear-gradient(90deg, oklch(0.62 0.24 15), oklch(0.78 0.16 75))" />
        <StatCard label="Medical" value="187" hint="99.4% on-time" icon={<HeartPulse />} accent="linear-gradient(90deg, oklch(0.62 0.24 15), oklch(0.52 0.19 258))" />
        <StatCard label="Revenue" value="₹42.1L" delta="+12%" icon={<IndianRupee />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-semibold">Nationwide fleet</div>
              <div className="text-xs text-muted-foreground">214 vehicles · updated every 15s</div>
            </div>
            <div className="flex gap-4 text-xs">
              <Legend2 c="oklch(0.52 0.19 258)" l="In transit" />
              <Legend2 c="oklch(0.72 0.13 195)" l="At hub" />
              <Legend2 c="oklch(0.62 0.24 15)" l="Exception" />
            </div>
          </div>
          <div className="relative rounded-xl border overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 h-96">
            <div className="absolute inset-0 grid-pattern opacity-40" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="oklch(0.52 0.19 258 / 0.6)" />
                  <stop offset="100%" stopColor="oklch(0.52 0.19 258 / 0)" />
                </radialGradient>
              </defs>
              <path
                d="M 30 8 L 68 8 L 82 24 L 88 48 L 82 68 L 62 92 L 52 96 L 44 92 L 30 78 L 18 60 L 14 40 L 22 22 Z"
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="0.4"
              />
              {[["Delhi", 42, 22], ["Mumbai", 28, 58], ["Bengaluru", 46, 82], ["Chennai", 58, 84], ["Hyderabad", 50, 66], ["Kolkata", 74, 46]].map(([n, x, y]) => (
                <g key={n as string}>
                  <circle cx={x as number} cy={y as number} r="6" fill="url(#cityGlow)" />
                  <circle cx={x as number} cy={y as number} r="1.4" fill="oklch(0.52 0.19 258)" />
                  <text x={(x as number) + 2.4} y={(y as number) + 0.8} fontSize="2.2" fill="var(--muted-foreground)">{n as string}</text>
                </g>
              ))}
              {fleetDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r="0.7" fill={i % 5 === 0 ? "oklch(0.62 0.24 15)" : i % 3 === 0 ? "oklch(0.72 0.13 195)" : "oklch(0.52 0.19 258)"}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (i % 4) * 0.4}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
            <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-2 text-[11px]">
              <div className="font-medium">Delivery density heatmap</div>
              <div className="text-muted-foreground">Higher demand · Mumbai · Bengaluru · Delhi</div>
            </div>
          </div>
        </div>

        <div className="card-elevated p-5 bg-gradient-to-br from-primary/8 via-card to-accent/8">
          <div className="flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> AI insights · today</div>
          <ul className="mt-4 space-y-3 text-sm">
            <Insight t="Reroute 40 packages BOM → PUN" d="Save 42 min · avoid Andheri jam" tone="primary" />
            <Insight t="Shift 3 EV vans to BLR-South" d="Handles surge from 6–9 PM · +18% capacity" tone="accent" />
            <Insight t="Reassign 5 medical drops" d="Anita Sharma on-shift; dedicated lane" tone="medical" />
            <Insight t="Predicted failed deliveries: 24" d="Recipients unlikely home · nudge reschedule" tone="warning" />
          </ul>
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs">
            <Mini l="Time saved by AI" v="14.2 hrs" />
            <Mini l="Fuel saved" v="182 L" />
            <Mini l="CO₂ reduced" v="412 kg" />
            <Mini l="Route efficiency" v="94.6%" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-display font-semibold">Volume trend · last 7 days</div>
              <div className="text-xs text-muted-foreground">Shipments booked vs delivered</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-success"><TrendingUp className="h-3.5 w-3.5" /> +12.4%</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.volume} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
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
          <div className="text-xs text-muted-foreground">Distribution by category</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.categoryMix} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={4}>
                  {analytics.categoryMix.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i]} />))}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {analytics.categoryMix.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                <span className="flex-1">{c.name}</span>
                <span className="text-muted-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Warehouse className="h-4 w-4" /> Hub utilization</div>
          <div className="text-xs text-muted-foreground">Live queue depth</div>
          <div className="mt-4 space-y-3">
            {hubs.map((h) => (
              <div key={h.code}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code}<span className="text-muted-foreground font-normal"> · {h.city}</span></div>
                  <div className={`font-mono ${h.load > 85 ? "text-destructive" : h.load > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.load}%</div>
                </div>
                <Progress value={h.load} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Timer className="h-4 w-4" /> ETA accuracy</div>
          <div className="text-xs text-muted-foreground">Actual vs predicted (min)</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.eta}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Line type="monotone" dataKey="predicted" stroke="oklch(0.72 0.13 195)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="oklch(0.52 0.19 258)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold flex items-center gap-2"><Leaf className="h-4 w-4 text-success" /> Sustainability</div>
          <div className="text-xs text-muted-foreground">Emissions saved this quarter</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="delivered" fill="oklch(0.68 0.16 155)" radius={[8, 8, 0, 0]} />
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
              <div className="text-xs text-muted-foreground">Priority sorted · updated every 15s</div>
            </div>
          </div>
          <div className="divide-y">
            {shipments.map((s) => (
              <div key={s.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
                <div className="col-span-3">
                  <div className="text-xs font-mono">{s.tracking}</div>
                  <div className="text-sm font-medium">{s.fromCity} → {s.toCity}</div>
                </div>
                <div className="col-span-2 text-xs">{s.packageType}</div>
                <div className="col-span-3">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: s.progress + "%" }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.progress}%</div>
                </div>
                <div className="col-span-2 text-xs">{s.driver ?? "—"}</div>
                <div className="col-span-2 flex justify-end"><StatusBadge status={s.status} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Notifications</div>
          <div className="text-xs text-muted-foreground">Real-time system events</div>
          <ul className="mt-4 space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-lg border p-3">
                <span className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${
                  n.type === "medical" ? "bg-medical/15 text-medical"
                  : n.type === "warning" ? "bg-warning/15 text-warning-foreground"
                  : n.type === "success" ? "bg-success/15 text-success"
                  : "bg-primary/15 text-primary"
                }`}>
                  {n.type === "medical" ? <HeartPulse className="h-4 w-4" /> : n.type === "warning" ? <AlertTriangle className="h-4 w-4" /> : n.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.body}</div>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{n.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Legend2({ c, l }: { c: string; l: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: c }} />
      {l}
    </div>
  );
}
function Insight({ t, d, tone }: { t: string; d: string; tone: "primary" | "accent" | "warning" | "medical" }) {
  const bg = tone === "primary" ? "bg-primary" : tone === "accent" ? "bg-accent" : tone === "warning" ? "bg-warning" : "bg-medical";
  return (
    <li className="flex items-start gap-2.5">
      <span className={`h-1.5 w-1.5 rounded-full mt-2 ${bg}`} />
      <div>
        <div className="font-medium">{t}</div>
        <div className="text-xs text-muted-foreground">{d}</div>
      </div>
    </li>
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
