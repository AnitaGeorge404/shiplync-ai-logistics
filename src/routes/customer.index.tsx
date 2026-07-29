import { createFileRoute, Link } from "@tanstack/react-router";
import { shipments } from "@/lib/mock-data";
import { StatCard } from "@/components/shiplync/StatCard";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, ArrowRight, Sparkles, ShieldPlus, Leaf } from "lucide-react";

export const Route = createFileRoute("/customer/")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const active = shipments.filter((s) => !["delivered", "returned"].includes(s.status));
  const featured = shipments[0];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Good afternoon, Aditi</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Your logistics, in real time.</h1>
        </div>
        <Link to="/customer/book">
          <Button className="gap-1.5">Book new shipment <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active" value={active.length} delta="+2 today" icon={<Package />} hint="Being coordinated by AI" />
        <StatCard label="In transit" value={active.filter((s) => s.status === "in_transit").length} delta="On schedule" icon={<Truck />} />
        <StatCard label="Delivered this month" value="24" delta="+18%" icon={<CheckCircle2 />} />
        <StatCard label="Avg ETA accuracy" value="97.4%" delta="+1.2%" icon={<Clock />} hint="Vs. industry 82%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Featured shipment</div>
              <div className="font-display text-lg font-semibold mt-0.5">{featured.tracking}</div>
              <div className="text-sm text-muted-foreground">{featured.fromCity} → {featured.toCity} · {featured.packageType}</div>
            </div>
            <StatusBadge status={featured.status} />
          </div>
          <RouteMap from={featured.fromCity} to={featured.toCity} progress={featured.progress} className="h-72" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">ETA</div>
              <div className="text-sm font-medium mt-0.5">{featured.eta}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Driver</div>
              <div className="text-sm font-medium mt-0.5">{featured.driver ?? "Assigning…"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Vehicle</div>
              <div className="text-sm font-medium mt-0.5">{featured.vehicle ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3">
            <Link to="/customer/track/$id" params={{ id: featured.id }}>
              <Button variant="outline" size="sm" className="gap-1.5">Open live tracker <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5 bg-gradient-to-br from-primary/8 via-card to-accent/8">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Suggestions
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                <div>
                  <div className="font-medium">Consolidate 3 shipments to Delhi</div>
                  <div className="text-xs text-muted-foreground">Save ₹210 and 1.2 kg CO₂ by shipping together.</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2" />
                <div>
                  <div className="font-medium">Switch to EV delivery for BLR route</div>
                  <div className="text-xs text-muted-foreground">Same-day guarantee · +8% sustainability score.</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-warning mt-2" />
                <div>
                  <div className="font-medium">Reschedule pickup to 6 PM</div>
                  <div className="text-xs text-muted-foreground">Avoid heavy monsoon rain forecasted 3–5 PM.</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Sustainability</div>
              <Leaf className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">A+</div>
            <div className="text-xs text-muted-foreground">You saved 14.2 kg CO₂ this month with EV routes.</div>
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Insurance coverage</div>
              <ShieldPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">3 shipments covered up to ₹50,000 each.</div>
            <Button variant="outline" size="sm" className="mt-3">Manage</Button>
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div className="font-display font-semibold">Active shipments</div>
            <div className="text-xs text-muted-foreground">Live-updated every 30 seconds</div>
          </div>
          <Link to="/customer/shipments" className="text-xs text-primary font-medium hover:underline">View all →</Link>
        </div>
        <div className="divide-y">
          {active.map((s) => (
            <Link key={s.id} to="/customer/track/$id" params={{ id: s.id }} className="grid grid-cols-12 items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors">
              <div className="col-span-3">
                <div className="text-xs text-muted-foreground font-mono">{s.tracking}</div>
                <div className="text-sm font-medium mt-0.5">{s.fromCity} → {s.toCity}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{s.packageType} · {s.weight} kg</div>
              <div className="col-span-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: s.progress + "%" }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.progress}% complete</div>
              </div>
              <div className="col-span-2 text-xs">{s.eta}</div>
              <div className="col-span-2 flex justify-end"><StatusBadge status={s.status} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
