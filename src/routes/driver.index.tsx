import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Wallet, MapPin, CheckCircle2, Timer, Fuel, Star, Phone, ScanLine, Camera, KeyRound, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/driver/")({
  component: DriverDashboard,
});

const stops = [
  { id: "SL-8842013", addr: "402, Prestige Skyline, Bengaluru", win: "3:00 – 4:00 PM", type: "Express", km: 2.4, done: true },
  { id: "SL-8842020", addr: "Koramangala 5th Block, Bengaluru", win: "4:00 – 5:00 PM", type: "Medical", km: 3.1, priority: true },
  { id: "SL-8842022", addr: "HSR Sector 2, Bengaluru", win: "4:30 – 5:30 PM", type: "Standard", km: 1.8 },
  { id: "SL-8842024", addr: "Indiranagar, 12th Main", win: "5:00 – 6:00 PM", type: "Fragile", km: 2.9 },
  { id: "SL-8842025", addr: "Whitefield, ITPL Rd", win: "6:00 – 7:00 PM", type: "Standard", km: 6.2 },
  { id: "SL-8842028", addr: "Marathahalli Bridge", win: "6:30 – 7:30 PM", type: "Express", km: 4.4 },
];

function DriverDashboard() {
  const [online, setOnline] = useState(true);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Good afternoon, Ravi</div>
          <h1 className="font-display text-3xl font-semibold mt-1">6 stops · 18.4 km</h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-sm">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`} />
          <span className="text-sm font-medium">{online ? "On duty" : "Off duty"}</span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Today's earnings" value="₹1,840" delta="+₹240" icon={<Wallet />} />
        <StatCard label="Completed" value="7 / 13" delta="On pace" icon={<CheckCircle2 />} />
        <StatCard label="Route efficiency" value="94%" delta="+3%" icon={<MapPin />} />
        <StatCard label="Avg delivery time" value="9m 42s" delta="−1m" icon={<Timer />} />
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
          <Link to="/driver/route" className="text-xs text-primary font-medium hover:underline">Open route →</Link>
        </div>
        <div className="divide-y">
          {stops.map((s, i) => (
            <div key={s.id} className={`grid grid-cols-12 items-center gap-3 px-5 py-3.5 ${s.done ? "opacity-50" : ""}`}>
              <div className="col-span-1"><div className="h-8 w-8 rounded-full border grid place-items-center text-xs font-semibold">{i + 1}</div></div>
              <div className="col-span-4">
                <div className="text-sm font-medium">{s.addr}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{s.id}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{s.win}</div>
              <div className="col-span-2 text-xs">{s.type}{s.priority && <span className="ml-2 rounded-full bg-medical/10 text-medical border border-medical/20 px-2 py-0.5 text-[10px] font-medium">Medical</span>}</div>
              <div className="col-span-1 text-xs">{s.km} km</div>
              <div className="col-span-2 flex justify-end">
                {s.done ? <span className="text-xs text-success font-medium inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Delivered</span> : <Button size="sm" variant="outline">Navigate</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
