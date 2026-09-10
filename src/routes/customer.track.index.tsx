import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShipments, toBadgeStatus, toProgress } from "@/lib/api-hooks";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Timeline } from "@/components/shiplync/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  ShieldCheck,
  Share2,
  Truck,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/track/")({
  head: () => ({
    meta: [
      { title: "Track Shipment — ShipLync AI Logistics" },
      { name: "description", content: "Real-time parcel tracking with live map updates and status timeline." },
    ],
  }),
  component: TrackIndexPage,
});

function useTrackedShipment(trackingId: string | null) {
  return useQuery({
    queryKey: ["track", trackingId],
    enabled: !!trackingId,
    queryFn: async () => {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(trackingId!)}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ shipment: any; events: any[] }>;
    },
  });
}

function TrackIndexPage() {
  const navigate = useNavigate();
  const { data: myShipments = [] } = useShipments("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTrackingId && myShipments.length > 0) {
      setSelectedTrackingId(myShipments[0].trackingId);
    }
  }, [myShipments, selectedTrackingId]);

  const { data: tracked, isLoading: trackLoading } = useTrackedShipment(selectedTrackingId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const res = await fetch(`/api/shipments/track/${encodeURIComponent(q)}`);
    if (res.ok) {
      setSelectedTrackingId(q);
      toast.success(`Found shipment ${q}`);
    } else {
      toast.error("No shipment found with that tracking ID.");
    }
  };

  const events = useMemo(() => {
    if (!tracked?.events) return [];
    return tracked.events.map((e: any) => ({
      key: e.id,
      label: e.status.replace(/_/g, " "),
      time: new Date(e.createdAt).toLocaleString(),
      location: e.location,
      note: e.note,
      done: true,
    }));
  }, [tracked]);

  const s = tracked?.shipment;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Live Tracking Hub</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Track Your Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Real shipment status and event history, pulled live from the database.
        </p>
      </div>

      <div className="card-elevated p-6 space-y-4 bg-card">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Tracking ID (e.g. SLXA1B2C3D4)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background font-mono text-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-6 gap-2">
            Track Parcel <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {myShipments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-muted-foreground font-medium">Your shipments:</span>
            {myShipments.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setSelectedTrackingId(m.trackingId)}
                className={`px-3 py-1 rounded-full border text-xs font-mono transition-all ${
                  selectedTrackingId === m.trackingId
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {m.trackingId} ({m.senderCity} → {m.receiverCity})
              </button>
            ))}
          </div>
        )}
      </div>

      {myShipments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Your shipments ({myShipments.length})
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {myShipments.slice(0, 3).map((m: any) => (
              <div
                key={m.id}
                onClick={() => setSelectedTrackingId(m.trackingId)}
                className={`card-elevated p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${
                  selectedTrackingId === m.trackingId ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{m.trackingId}</span>
                  <StatusBadge status={toBadgeStatus(m.status)} />
                </div>
                <div className="font-display font-semibold text-base">{m.senderCity} → {m.receiverCity}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 capitalize">
                  <span>{m.packageType}</span><span>·</span><span>{m.weightKg} kg</span>
                  {m.packageType === "medical" && <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">Medical</Badge>}
                </div>
                <div className="mt-4 space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${toProgress(m.status)}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-0.5">{toProgress(m.status)}% complete</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!trackLoading && !s && selectedTrackingId && (
        <div className="card-elevated p-10 text-center text-sm text-muted-foreground">
          No shipment found for "{selectedTrackingId}".
        </div>
      )}

      {!selectedTrackingId && myShipments.length === 0 && (
        <div className="card-elevated p-10 text-center">
          <div className="text-sm font-medium">Nothing to track yet</div>
          <div className="text-xs text-muted-foreground mt-1">Book a shipment, or enter a tracking ID above.</div>
        </div>
      )}

      {s && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{s.trackingId}</span>
                <StatusBadge status={toBadgeStatus(s.status)} />
                {s.packageType === "medical" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Medical Priority
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl font-semibold mt-1">{s.senderCity} → {s.receiverCity}</h2>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Tracking link copied to clipboard!");
                }}
              >
                <Share2 className="h-3.5 w-3.5" /> Share Track Link
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => navigate({ to: "/customer/track/$id", params: { id: s.trackingId } })}
              >
                Full Screen Map <Navigation className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Route
                  </span>
                </div>
                <RouteMap from={s.senderCity} to={s.receiverCity} progress={toProgress(s.status)} className="h-96 rounded-xl border shadow-sm" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card-elevated p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimated Arrival</div>
                  <div className="text-sm font-semibold mt-1 text-primary">
                    {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleString() : "TBD"}
                  </div>
                </div>
                <div className="card-elevated p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority</div>
                  <div className="text-sm font-semibold mt-1 capitalize">{s.priority}</div>
                </div>
                <div className="card-elevated p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Package</div>
                  <div className="text-sm font-semibold mt-1 capitalize">{s.weightKg} kg ({s.packageType})</div>
                </div>
                <div className="card-elevated p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cost</div>
                  <div className="text-sm font-semibold mt-1">₹{s.cost}</div>
                </div>
              </div>

              <div className="card-elevated p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-display font-semibold text-base">Shipment Journey Timeline</h3>
                    <p className="text-xs text-muted-foreground">Real events recorded against this shipment</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {events.length} events
                  </Badge>
                </div>
                {events.length > 0 ? <Timeline events={events} /> : (
                  <div className="text-xs text-muted-foreground py-4 text-center">No status events recorded yet.</div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-elevated p-5 text-center space-y-2">
                {s.assignedAgentId ? (
                  <>
                    <Truck className="h-8 w-8 text-primary mx-auto opacity-80" />
                    <div className="font-medium text-sm">Delivery agent assigned</div>
                    <p className="text-xs text-muted-foreground">Your parcel has an assigned delivery partner.</p>
                  </>
                ) : (
                  <>
                    <Truck className="h-8 w-8 text-muted-foreground mx-auto opacity-60" />
                    <div className="font-medium text-sm">Awaiting assignment</div>
                    <p className="text-xs text-muted-foreground">A delivery partner hasn't been assigned yet.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
