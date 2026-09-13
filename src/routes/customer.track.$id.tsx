import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Timeline } from "@/components/shiplync/Timeline";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Sparkles, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_PROGRESS: Record<string, number> = {
  booked: 5,
  payment_completed: 10,
  picked_up: 25,
  arrived_hub: 40,
  in_transit: 60,
  out_for_delivery: 85,
  delivery_attempted: 90,
  delivered: 100,
  returned: 100,
  cancelled: 0,
};

const STATUS_BADGE_MAP: Record<string, string> = {
  booked: "booked",
  payment_completed: "booked",
  picked_up: "picked_up",
  arrived_hub: "at_hub",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivery_attempted: "exception",
  delivered: "delivered",
  returned: "exception",
  cancelled: "exception",
};

export const Route = createFileRoute("/customer/track/$id")({
  loader: async ({ params }) => {
    if (typeof window === "undefined") return null; // resolved client-side; see below
    const res = await fetch(`/api/shipments/track/${encodeURIComponent(params.id)}`);
    if (!res.ok) throw notFound();
    return res.json() as Promise<{ shipment: any; events: any[] }>;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.shipment ? `Tracking ${loaderData.shipment.trackingId} — ShipLync` : "Track shipment — ShipLync" },
      { name: "description", content: "Live shipment tracking with map, ETA and delivery timeline." },
    ],
  }),
  component: TrackShipment,
});

function TrackShipment() {
  const data = Route.useLoaderData();

  if (!data) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading tracking data…</div>;
  }

  const s = data.shipment;
  const events = data.events.map((e: any) => ({
    key: e.id,
    label: e.status.replace(/_/g, " "),
    time: new Date(e.createdAt).toLocaleString(),
    location: e.location,
    note: e.note,
    done: true,
  }));
  const progress = STATUS_PROGRESS[s.status] ?? 0;
  const nextEvent = data.events[data.events.length - 1]?.status ?? "booked";

  return (
    <div className="space-y-6">
      <Link to="/customer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard</Link>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{s.trackingId}</div>
          <h1 className="font-display text-3xl font-semibold mt-1">{s.senderCity} → {s.receiverCity}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={STATUS_BADGE_MAP[s.status] as any} />
            {s.packageType === "medical" && <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
              <ShieldCheck className="h-3 w-3" /> Medical priority</span>}
            <span className="text-xs text-muted-foreground capitalize">{s.packageType} · {s.weightKg} kg</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Tracking link copied");
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RouteMap from={s.senderCity} to={s.receiverCity} progress={progress} className="h-96" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact k="ETA" v={s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleString() : "TBD"} />
            <Fact k="Priority" v={s.priority} />
            <Fact k="Last event" v={nextEvent.replace(/_/g, " ")} />
            <Fact k="Cost" v={`₹${s.cost}`} />
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold">Delivery timeline</div>
              <div className="text-xs text-muted-foreground">{events.length} recorded events</div>
            </div>
            {events.length > 0 ? <Timeline events={events} /> : (
              <div className="text-xs text-muted-foreground py-4 text-center">No events recorded yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5 text-center space-y-2">
            {s.assignedAgentId ? (
              <>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Delivery partner</div>
                <div className="font-medium text-sm">Agent assigned</div>
                <p className="text-xs text-muted-foreground">A delivery partner has been assigned to your shipment.</p>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Delivery partner</div>
                <div className="font-medium text-sm text-muted-foreground">Not yet assigned</div>
              </>
            )}
          </div>

          {s.priority !== "normal" && (
            <div className="card-elevated p-5 bg-muted/40">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Priority handling
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                This shipment is flagged <strong className="text-foreground capitalize">{s.priority}</strong> priority
                {s.packageType === "medical" ? " (medical package — automatically escalated)" : ""}, so it receives dispatch
                priority at hubs and shorter target delivery windows.
              </div>
            </div>
          )}

          <div className="card-elevated p-5">
            <div className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Proof of delivery</div>
            <div className="mt-3 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              {s.status === "delivered" ? "Delivered — OTP verified at drop-off." : "Will appear here once delivered."}
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
      <div className="text-sm font-medium mt-1 capitalize">{v}</div>
    </div>
  );
}
