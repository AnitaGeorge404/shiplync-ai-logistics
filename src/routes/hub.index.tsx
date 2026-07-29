import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { drivers, hubs } from "@/lib/mock-data";
import { PackageCheck, PackageOpen, Truck, AlertTriangle, HeartPulse, ScanLine, ArrowRightLeft, UserCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/hub/")({
  component: HubDashboard,
});

const incoming = [
  { id: "SLX-77420-IN", from: "Mumbai", type: "Express", weight: "2.4 kg", eta: "in 12m", priority: false },
  { id: "SLX-77421-IN", from: "Delhi", type: "Medical", weight: "0.8 kg", eta: "in 4m", priority: true },
  { id: "SLX-77430-IN", from: "Pune", type: "Fragile", weight: "5.6 kg", eta: "in 22m", priority: false },
  { id: "SLX-77441-IN", from: "Kochi", type: "Standard", weight: "12 kg", eta: "in 38m", priority: false },
];

const dispatchQueue = [
  { id: "SLX-77500", to: "Koramangala", driver: "Ravi K.", vehicle: "EV Bike", status: "Ready" },
  { id: "SLX-77501", to: "Whitefield", driver: "—", vehicle: "—", status: "Assigning" },
  { id: "SLX-77502", to: "HSR", driver: "Priya R.", vehicle: "EV Van", status: "Loading" },
  { id: "SLX-77503", to: "Indiranagar", driver: "Suresh N.", vehicle: "Bike", status: "Ready" },
];

export function HubDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">BLR-South Hub · Live control room</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Sorting bay operating at 64% load</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Incoming today" value="342" delta="+42" icon={<PackageOpen />} />
        <StatCard label="Ready to dispatch" value="188" delta="42 pending" icon={<Truck />} trend="flat" />
        <StatCard label="Dispatched" value="612" delta="+68" icon={<PackageCheck />} />
        <StatCard label="Exceptions" value="5" delta="1 critical" trend="down" icon={<AlertTriangle />} />
        <StatCard label="Medical queue" value="3" hint="All priority-locked" icon={<HeartPulse />} accent="linear-gradient(90deg, oklch(0.62 0.24 15), oklch(0.78 0.16 75))" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Incoming shipments · next 60 min</div>
            <Button size="sm" variant="outline" className="gap-1.5"><ScanLine className="h-3.5 w-3.5" /> Open scanner</Button>
          </div>
          <div className="divide-y">
            {incoming.map((r) => (
              <div key={r.id} className="grid grid-cols-12 items-center gap-3 py-3">
                <div className="col-span-3 font-mono text-xs">{r.id}</div>
                <div className="col-span-2 text-sm">{r.from}</div>
                <div className="col-span-2 text-xs">{r.type}{r.priority && <span className="ml-2 rounded-full bg-medical/10 text-medical border border-medical/20 px-2 py-0.5 text-[10px] font-medium">Medical</span>}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{r.weight}</div>
                <div className="col-span-2 text-xs">{r.eta}</div>
                <div className="col-span-1 flex justify-end"><Button size="sm" variant="ghost">Receive</Button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 bg-gradient-to-br from-primary/8 to-accent/8">
          <div className="flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> AI dispatch assistant</div>
          <div className="mt-3 rounded-lg border bg-card p-3 text-sm">
            <div className="font-medium">"Deliver these 42 packages before 8 PM"</div>
            <div className="text-xs text-muted-foreground mt-1">AI clustered 42 stops into 6 routes, assigned 5 drivers, minimized 18.2 km.</div>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Routes generated</span><span className="font-medium">6</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Drivers assigned</span><span className="font-medium">5</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est completion</span><span className="font-medium text-success">7:42 PM</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fuel saved</span><span className="font-medium text-success">3.4 L</span></div>
          </div>
          <Button className="mt-4 w-full">Approve & dispatch</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Dispatch queue</div>
            <Button size="sm" variant="outline" className="gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5" /> Reassign</Button>
          </div>
          <div className="divide-y">
            {dispatchQueue.map((d) => (
              <div key={d.id} className="grid grid-cols-12 gap-2 py-3 items-center">
                <div className="col-span-3 font-mono text-xs">{d.id}</div>
                <div className="col-span-3 text-sm">{d.to}</div>
                <div className="col-span-3 text-xs">{d.driver}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{d.vehicle}</div>
                <div className="col-span-1 text-right">
                  <span className={`text-[10px] rounded-full px-2 py-0.5 border ${
                    d.status === "Ready" ? "bg-success/10 text-success border-success/20"
                    : d.status === "Loading" ? "bg-warning/10 border-warning/20"
                    : "bg-muted text-muted-foreground border-border"
                  }`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Hub load balancing</div>
          <div className="text-xs text-muted-foreground">Redirecting shipments when neighboring hubs are congested</div>
          <div className="mt-4 space-y-3">
            {hubs.map((h) => (
              <div key={h.code}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code} <span className="text-muted-foreground font-normal">· {h.city}</span></div>
                  <div className={`font-mono ${h.load > 85 ? "text-destructive" : h.load > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.load}%</div>
                </div>
                <Progress value={h.load} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b font-display font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4" /> Available delivery partners</div>
        <div className="divide-y">
          {drivers.map((d) => (
            <div key={d.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
              <div className="col-span-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white text-xs font-semibold">{d.name.split(" ").map((w: string) => w[0]).join("")}</div>
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.id}</div>
                </div>
              </div>
              <div className="col-span-2 text-xs">{d.city}</div>
              <div className="col-span-2 text-xs">{d.vehicle}</div>
              <div className="col-span-2 text-xs">★ {d.rating}</div>
              <div className="col-span-1 text-xs">{d.load} stops</div>
              <div className="col-span-1 text-xs">
                <span className={`inline-flex items-center gap-1 ${d.onDuty ? "text-success" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${d.onDuty ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`} />
                  {d.onDuty ? "Available" : "Off duty"}
                </span>
              </div>
              <div className="col-span-1 flex justify-end"><Button size="sm" variant="outline" disabled={!d.onDuty}>Assign</Button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
