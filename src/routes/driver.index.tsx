import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Wallet, MapPin, CheckCircle2, Timer, Fuel, Star, Phone, ScanLine, Camera, KeyRound, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useShipments } from "@/lib/api-hooks";

export const Route = createFileRoute("/driver/")({
  component: DriverDashboard,
});

function DriverDashboard() {
  const [online, setOnline] = useState(true);
  const { data: assigned = [] } = useShipments("assigned");
  const completed = assigned.filter((s: any) => s.status === "delivered").length;
  const totalKm = assigned.length * 2.4; // no live GPS distance yet — see PROGRESS_REPORT.md
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Good afternoon</div>
          <h1 className="font-display text-3xl font-semibold mt-1">{assigned.length} stops · {totalKm.toFixed(1)} km</h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-sm">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`} />
          <span className="text-sm font-medium">{online ? "On duty" : "Off duty"}</span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Assigned today" value={String(assigned.length)} icon={<Wallet />} />
        <StatCard label="Completed" value={`${completed} / ${assigned.length}`} icon={<CheckCircle2 />} />
        <StatCard label="Route efficiency" value="94%" delta="AI estimate" icon={<MapPin />} />
        <StatCard label="Avg delivery time" value="9m 42s" delta="AI estimate" icon={<Timer />} />
        <StatCard label="Rating" value="4.9" delta="Last 30d" icon={<Star />} hint="812 ratings" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display font-semibold">Optimized route</div>
              <div className="text-xs text-muted-foreground">AI reduced distance by 6.2 km · saved ~28 min</div>
            </div>
            <Button size="sm" className="gap-1.5">Start navigation <ChevronRight className="h-4 w-4" /></Button>
          </div>
          <RouteMap from="Hub · BLR-South" to="Whitefield · Final stop" progress={42} className="h-72" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 flex items-center gap-2"><Fuel className="h-4 w-4 text-success" /><div><div className="text-xs text-muted-foreground">Fuel efficiency</div><div className="text-sm font-medium">18.4 km/L</div></div></div>
            <div className="rounded-lg border p-3 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /><div><div className="text-xs text-muted-foreground">Est completion</div><div className="text-sm font-medium">8:45 PM</div></div></div>
            <div className="rounded-lg border p-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-foreground" /><div><div className="text-xs text-muted-foreground">Distance left</div><div className="text-sm font-medium">12.1 km</div></div></div>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Delivery checklist</div>
          <div className="text-xs text-muted-foreground">Next stop: 402, Prestige Skyline</div>
          <div className="mt-4 space-y-3">
            {[
              { i: ScanLine, t: "Scan package QR", d: "SLX-77420-IN" },
              { i: KeyRound, t: "OTP verification", d: "Enter 4-digit code" },
              { i: Camera, t: "Capture photo POD", d: "Doorstep + package" },
              { i: CheckCircle2, t: "Digital signature", d: "Optional" },
            ].map((it) => (
              <div key={it.t} className="flex items-start gap-3 rounded-lg border p-3">
                <it.i className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{it.t}</div>
                  <div className="text-xs text-muted-foreground">{it.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5"><Phone className="h-3.5 w-3.5" /> Call customer</Button>
            <Button size="sm" className="flex-1">Mark delivered</Button>
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div className="font-display font-semibold">Today's stops</div>
            <div className="text-xs text-muted-foreground">Sequence optimized by AI · reorder disabled</div>
          </div>
          <Link to="/driver/my-route" className="text-xs text-primary font-medium hover:underline">Open route →</Link>
        </div>
        <div className="divide-y">
          {assigned.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-muted-foreground">
              No shipments assigned yet.
            </div>
          )}
          {assigned.map((s: any, i: number) => (
            <div key={s.id} className={`grid grid-cols-12 items-center gap-3 px-5 py-3.5 ${s.status === "delivered" ? "opacity-50" : ""}`}>
              <div className="col-span-1"><div className="h-8 w-8 rounded-full border grid place-items-center text-xs font-semibold">{i + 1}</div></div>
              <div className="col-span-4">
                <div className="text-sm font-medium">{s.receiverAddressLine}, {s.receiverCity}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{s.trackingId}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground capitalize">{s.status.replace(/_/g, " ")}</div>
              <div className="col-span-2 text-xs capitalize">{s.packageType}{s.packageType === "medical" && <span className="ml-2 rounded-full bg-medical/10 text-medical border border-medical/20 px-2 py-0.5 text-[10px] font-medium">Medical</span>}</div>
              <div className="col-span-1 text-xs">{s.weightKg} kg</div>
              <div className="col-span-2 flex justify-end">
                {s.status === "delivered" ? <span className="text-xs text-success font-medium inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Delivered</span> : <Link to="/driver/deliveries"><Button size="sm" variant="outline">Manage</Button></Link>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
