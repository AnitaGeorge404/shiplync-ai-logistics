import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { shipments, timeline } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Timeline } from "@/components/shiplync/Timeline";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Share2, ShieldCheck, Camera, Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/customer/track/$id")({
  loader: ({ params }) => {
    const s = shipments.find((x) => x.id === params.id);
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Tracking ${loaderData.tracking} — ShipLync` : "Track shipment — ShipLync" },
      { name: "description", content: "Live shipment tracking with map, ETA and delivery timeline." },
    ],
  }),
  component: TrackShipment,
});

function TrackShipment() {
  const s = Route.useLoaderData();
  const events = timeline(s);

  return (
    <div className="space-y-6">
      <Link to="/customer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard</Link>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{s.tracking}</div>
          <h1 className="font-display text-3xl font-semibold mt-1">{s.fromCity} → {s.toCity}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={s.status} />
            {s.medical && <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
              <ShieldCheck className="h-3 w-3" /> Medical priority</span>}
            <span className="text-xs text-muted-foreground">{s.packageType} · {s.weight} kg · Sustainability {s.sustainability}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> Call driver</Button>
          <Button size="sm" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Message</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RouteMap from={s.fromCity} to={s.toCity} progress={s.progress} className="h-96" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact k="ETA" v={s.eta} />
            <Fact k="Current hub" v={s.hub ?? "—"} />
            <Fact k="Next event" v="Out for delivery" />
            <Fact k="Distance left" v="24.6 km" />
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold">Delivery timeline</div>
              <div className="text-xs text-muted-foreground">Auto-updated by AI Coordinator</div>
            </div>
            <Timeline events={events} />
          </div>
        </div>

        <div className="space-y-4">
          {s.driver && (
            <div className="card-elevated p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Delivery partner</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white font-semibold">
                  {s.driver.split(" ").map((w: string) => w[0]).join("")}
                </div>
                <div>
                  <div className="font-medium">{s.driver}</div>
                  <div className="text-xs text-muted-foreground">★ 4.9 · 812 deliveries</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{s.vehicle}</div>
              <div className="mt-3 text-xs text-muted-foreground">{s.driverPhone}</div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5"><Phone className="h-3.5 w-3.5" /> Call</Button>
                <Button size="sm" className="flex-1 gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Chat</Button>
              </div>
            </div>
          )}

          <div className="card-elevated p-5 bg-gradient-to-br from-primary/8 via-card to-accent/8">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI ETA engine
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <Row l="Live traffic" v="+6 min" />
              <Row l="Weather (light rain)" v="+3 min" />
              <Row l="Elevator wait (14F)" v="+2 min" />
              <Row l="Driver workload" v="Optimal" ok />
              <Row l="Confidence" v="96%" ok />
            </div>
          </div>

          <div className="card-elevated p-5">
            <div className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Proof of delivery</div>
            <div className="mt-3 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Photo & signature will appear here once delivered.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="text-sm font-medium mt-1">{v}</div>
    </div>
  );
}
function Row({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className={`font-medium ${ok ? "text-success" : ""}`}>{v}</span>
    </div>
  );
}
