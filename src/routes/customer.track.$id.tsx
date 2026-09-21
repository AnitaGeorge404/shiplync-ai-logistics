import { useState, useEffect } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { LiveDeliveryMap } from "@/components/shiplync/LiveDeliveryMap";
import { ShipmentMilestones } from "@/components/shiplync/ShipmentMilestones";
import { Timeline } from "@/components/shiplync/Timeline";
import { Barcode } from "@/components/shiplync/Barcode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toBadgeStatus, toProgress } from "@/lib/api-hooks";
import { getDeliveryOtp } from "@/lib/otp";
import { ShieldCheck, Camera, ArrowLeft, Share2, AlertTriangle, RotateCcw, CheckCircle2, XCircle, KeyRound, Copy, Map, Compass } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/track/$id")({
  head: () => ({
    meta: [
      { title: "Track shipment — ShipLync" },
      { name: "description", content: "Live shipment tracking with map, ETA and delivery timeline." },
    ],
  }),
  component: TrackShipment,
});

type TrackData = {
  shipment: any;
  events: any[];
  currentHubName: string | null;
  attempts: any[];
  exceptions: any[];
  destinationCoords?: { lat: number; lng: number };
  originCoords?: { lat: number; lng: number };
  liveLocation?: any;
  partner?: any;
};

function TrackShipment() {
  const { id } = useParams({ from: "/customer/track/$id" });
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["customer-track", id],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const err = new Error(res.status === 404 ? "not_found" : "request_failed");
        (err as any).status = res.status;
        throw err;
      }
      return res.json() as Promise<TrackData>;
    },
    // A 404 is a definite answer, not a transient failure — retrying it just
    // delays the not-found state. Other errors (network blips, 5xx) get a
    // couple of quick retries before we show the error state.
    retry: (failureCount, err: any) => err?.status !== 404 && failureCount < 2,
    retryDelay: 500,
  });

  const [liveData, setLiveData] = useState<{
    liveLocation: any;
    partner: any;
    destinationCoords: { lat: number; lng: number };
    originCoords: { lat: number; lng: number };
  }>({
    liveLocation: data?.liveLocation ?? null,
    partner: data?.partner ?? null,
    destinationCoords: data?.destinationCoords ?? { lat: 9.5916, lng: 76.5222 },
    originCoords: data?.originCoords ?? { lat: 9.4678, lng: 76.5412 },
  });

  const [mapType, setMapType] = useState<"live" | "schematic">("live");

  // Keep liveData in sync if loader finishes resolving
  useEffect(() => {
    if (data) {
      setLiveData({
        liveLocation: data.liveLocation ?? null,
        partner: data.partner ?? null,
        destinationCoords: data.destinationCoords ?? { lat: 9.5916, lng: 76.5222 },
        originCoords: data.originCoords ?? { lat: 9.4678, lng: 76.5412 },
      });
    }
  }, [data]);

  // Real-time polling every 3 seconds for live partner location updates
  useEffect(() => {
    const s = data?.shipment;
    if (!s || ["delivered", "cancelled", "returned"].includes(s.status)) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/shipments/track/${encodeURIComponent(s.trackingId)}/live`);
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.liveLocation) {
            setLiveData((prev) => ({
              ...prev,
              liveLocation: json.liveLocation,
              partner: json.partner || prev.partner,
              destinationCoords: json.destinationCoords || prev.destinationCoords,
              originCoords: json.originCoords || prev.originCoords,
            }));
          }
        }
      } catch {
        // Silently ignore transient network blip
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [data?.shipment?.trackingId, data?.shipment?.status]);

  if (isError) {
    const notFound = (error as any)?.status === 404;
    return (
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground py-10 text-center">
        {notFound ? (
          <p>Shipment not found. Check the tracking ID and try again.</p>
        ) : (
          <>
            <p>Couldn't load this shipment. Check your connection and try again.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading tracking data…</div>;
  }

  const s = data.shipment;

  async function refreshTracking() {
    try {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(s.trackingId)}/live`);
      if (res.ok) {
        const json = await res.json();
        if (json.liveLocation) {
          setLiveData((prev) => ({
            ...prev,
            liveLocation: json.liveLocation,
            partner: json.partner || prev.partner,
            destinationCoords: json.destinationCoords || prev.destinationCoords,
            originCoords: json.originCoords || prev.originCoords,
          }));
          toast.success("Location refreshed");
        }
      }
    } catch {
      toast.error("Could not refresh location");
    }
  }

  const events = data.events.map((e: any) => ({
    key: e.id,
    label: e.status.replace(/_/g, " "),
    time: new Date(e.createdAt).toLocaleString(),
    location: e.location,
    note: e.note,
    done: true,
  }));
  const progress = toProgress(s.status);
  const nextEvent = data.events[data.events.length - 1]?.status ?? "booked";
  const attempts = data.attempts ?? [];
  const exceptions = data.exceptions ?? [];

  return (
    <div className="space-y-6">
      <Link to="/customer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard</Link>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{s.trackingId}</div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">{s.senderCity} → {s.receiverCity}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={toBadgeStatus(s.status)} />
            {s.packageType === "medical" && <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
              <ShieldCheck className="h-3 w-3" /> Medical priority</span>}
            <span className="text-xs text-muted-foreground capitalize">{s.packageType} · {s.weightKg} kg</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimated delivery</div>
            <div className="text-sm font-medium">{s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleString() : "TBD"}</div>
          </div>
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

      {s.status !== "delivered" && s.status !== "cancelled" && s.status !== "returned" && (
        <div className="card-elevated p-4 sm:p-5 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-foreground">Delivery Verification OTP</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/25">
                    Required for drop-off
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share this 4-digit code with your delivery partner to verify and complete delivery.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-primary bg-background px-4 py-1.5 rounded-lg border border-primary/30 shadow-sm">
                {s.deliveryOtp || getDeliveryOtp(s.trackingId)}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-10 px-3"
                onClick={() => {
                  navigator.clipboard?.writeText(s.deliveryOtp || getDeliveryOtp(s.trackingId));
                  toast.success("Delivery OTP copied to clipboard");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="card-elevated p-5 sm:p-6">
        <ShipmentMilestones status={s.status} events={data.events} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-display">Live Delivery Route</span>
                {liveData.liveLocation && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Real-time GPS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setMapType("live")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mapType === "live"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  OpenStreetMap
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("schematic")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mapType === "schematic"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Milestones Map
                </button>
              </div>
            </div>

            {mapType === "live" ? (
              <LiveDeliveryMap
                destinationCoords={liveData.destinationCoords}
                destinationAddress={`${s.receiverAddressLine}, ${s.receiverCity}, ${s.receiverState} ${s.receiverPincode}`}
                driverLocation={liveData.liveLocation}
                originCoords={liveData.originCoords}
                partner={liveData.partner}
                status={s.status}
                deliveryOtp={s.deliveryOtp || getDeliveryOtp(s.trackingId)}
                className="h-80 sm:h-[440px]"
                onRefresh={refreshTracking}
              />
            ) : (
              <RouteMap from={s.senderCity} to={s.receiverCity} progress={progress} className="h-72 sm:h-96" />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact
              k="Current location"
              v={
                s.currentLocationCity
                  ? `${s.currentLocationCity} Hub`
                  : data.currentHubName ?? nextEvent.replace(/_/g, " ")
              }
            />
            <Fact k="Priority" v={s.priority} />
            <Fact k="Distance" v={s.distanceKm ? `${Math.round(s.distanceKm)} km` : "—"} />
            <Fact k="Package" v={`${s.packageType} · ${s.weightKg} kg`} />
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold">Activity log</div>
              <div className="text-xs text-muted-foreground">{events.length} recorded events</div>
            </div>
            {events.length > 0 ? <Timeline events={events} /> : (
              <div className="text-xs text-muted-foreground py-4 text-center">No events recorded yet.</div>
            )}
          </div>

          {exceptions.length > 0 && (
            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 font-display font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Exceptions
              </div>
              <div className="mt-3 space-y-2">
                {exceptions.map((ex: any) => (
                  <div key={ex.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium capitalize">{ex.type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {ex.resolved ? "Resolved" : "Open"} · {new Date(ex.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ex.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attempts.length > 0 && (
            <div className="card-elevated p-5">
              <div className="font-display font-semibold">Delivery attempts</div>
              <div className="mt-3 space-y-2">
                {attempts.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`h-7 w-7 rounded-full grid place-items-center shrink-0 ${a.outcome === "delivered" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                      {a.outcome === "delivered" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">Attempt #{a.attemptNumber} · <span className="capitalize">{a.outcome.replace(/_/g, " ")}</span></div>
                      {a.reason && <div className="text-xs text-muted-foreground mt-0.5">{a.reason}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1">{new Date(a.attemptedAt ?? a.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                <ShieldCheck className="h-3.5 w-3.5" /> Priority handling
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
            <div className="mt-3 rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">
              {s.status === "delivered" ? (
                <div className="space-y-1 text-success">
                  <CheckCircle2 className="h-6 w-6 mx-auto text-success" />
                  <div className="font-semibold text-sm">Delivered Successfully</div>
                  <div className="text-xs text-muted-foreground">
                    OTP Verified ({s.deliveryOtp || getDeliveryOtp(s.trackingId)}) by delivery partner at drop-off.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Delivery verification pending</div>
                  <div>Share OTP {s.deliveryOtp || getDeliveryOtp(s.trackingId)} with agent at arrival.</div>
                </div>
              )}
            </div>
          </div>

          <div className="card-elevated p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-muted-foreground">Shipping label barcode</div>
            <Barcode value={s.trackingId} height={40} />
          </div>

          {s.status === "returned" && (
            <div className="card-elevated p-5 bg-muted/40">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Returned to sender
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Delivery couldn't be completed and this shipment has been sent back. See the Returns page for details.
              </p>
            </div>
          )}
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
