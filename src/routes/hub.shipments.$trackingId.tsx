import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { PriorityBadge } from "@/components/shiplync/PriorityBadge";
import { ShipmentMilestones } from "@/components/shiplync/ShipmentMilestones";
import { Timeline } from "@/components/shiplync/Timeline";
import { Barcode } from "@/components/shiplync/Barcode";
import { useAgents, toBadgeStatus } from "@/lib/api-hooks";
import { ArrowLeft, ShieldCheck, AlertTriangle, Truck, ArrowLeftRight, Warehouse, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hub/shipments/$trackingId")({
  head: () => ({
    meta: [
      { title: "Shipment — Hub Operations" },
      { name: "description", content: "Hub-side shipment record: status, hub history, priority and exceptions." },
    ],
  }),
  component: HubShipmentDetail,
});

const DISPATCHABLE = ["arrived_hub", "picked_up", "in_transit"];

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="text-sm font-medium mt-1">{v}</div>
    </div>
  );
}

function HubShipmentDetail() {
  const { trackingId } = useParams({ from: "/hub/shipments/$trackingId" });
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["hub-shipment-detail", trackingId],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(trackingId)}`);
      if (!res.ok) {
        const err = new Error(res.status === 404 ? "not_found" : "request_failed");
        (err as any).status = res.status;
        throw err;
      }
      return res.json() as Promise<{ shipment: any; events: any[]; currentHubName: string | null; attempts: any[]; exceptions: any[] }>;
    },
    retry: (failureCount, err: any) => err?.status !== 404 && failureCount < 2,
    retryDelay: 500,
  });
  const { data: agents = [] } = useAgents();

  if (isError) {
    const notFound = (error as any)?.status === 404;
    return (
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground py-10 text-center">
        {notFound ? (
          <p>Shipment not found.</p>
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
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading shipment record…</div>;
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

  // Real hub history, derived from the same events the customer timeline
  // uses — every "arrived_hub" event's location is the real hub name that
  // scanned it in (see api-router.ts), so this needs no new backend call.
  const hubHistory = data.events.filter((e: any) => e.status === "arrived_hub" && e.location);

  const agent = agents.find((a: any) => a.id === s.assignedAgentId);
  const exceptions = data.exceptions ?? [];
  const openExceptions = exceptions.filter((e: any) => !e.resolved);

  const isDispatchable = DISPATCHABLE.includes(s.status) && !s.destinationHubId;
  const isTransferring = !!s.destinationHubId;

  return (
    <div className="space-y-6">
      <Link to="/hub" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to control room
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{s.trackingId}</div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
            {s.senderCity} → {s.receiverCity}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={toBadgeStatus(s.status)} />
            <PriorityBadge priority={s.priority} />
            {s.packageType === "medical" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
                <ShieldCheck className="h-3 w-3" /> Medical priority
              </span>
            )}
            <span className="text-xs text-muted-foreground capitalize">{s.packageType} · {s.weightKg} kg</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isDispatchable && (
            <Link
              to="/hub/dispatch"
              className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-muted/60"
            >
              <Truck className="h-3.5 w-3.5" /> Dispatch from queue
            </Link>
          )}
          {isTransferring && (
            <Link
              to="/hub/transfers"
              className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-md px-3 py-1.5 hover:bg-muted/60"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> View in Transfers
            </Link>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-5 bg-card">
        <ShipmentMilestones status={s.status} events={data.events} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact k="Origin" v={s.senderCity} />
            <Fact k="Destination" v={s.receiverCity} />
            <Fact k="Current hub" v={data.currentHubName ?? "In transit — not at a hub"} />
            <Fact k="Distance" v={s.distanceKm ? `${Math.round(s.distanceKm)} km` : "—"} />
          </div>

          <div className="border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 font-display font-semibold mb-3">
              <Warehouse className="h-4 w-4" /> Hub history
            </div>
            {hubHistory.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">No hub arrival recorded yet.</div>
            ) : (
              <div className="divide-y">
                {hubHistory.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-medium">{e.location}</span>
                    <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-5 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold">Tracking history</div>
              <div className="text-xs text-muted-foreground">{events.length} recorded events</div>
            </div>
            {events.length > 0 ? <Timeline events={events} /> : (
              <div className="text-xs text-muted-foreground py-4 text-center">No events recorded yet.</div>
            )}
          </div>

          {openExceptions.length > 0 && (
            <div className="border rounded-lg p-5 bg-card">
              <div className="flex items-center gap-2 font-display font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Open exceptions
              </div>
              <div className="mt-3 space-y-2">
                {openExceptions.map((ex: any) => (
                  <div key={ex.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium capitalize">{ex.type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 capitalize">{ex.severity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ex.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-5 bg-card text-center space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Assignment</div>
            {agent ? (
              <>
                <div className="font-medium text-sm">{agent.name}</div>
                <p className="text-xs text-muted-foreground">{agent.phone}</p>
              </>
            ) : (
              <div className="font-medium text-sm text-muted-foreground">Not yet assigned</div>
            )}
          </div>

          {isTransferring && (
            <div className="border rounded-lg p-5 bg-muted/40">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer in progress
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                This shipment is in transit to another hub. It will clear from Transfers once scanned in on arrival.
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-card flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-muted-foreground">Shipping label barcode</div>
            <Barcode value={s.trackingId} height={40} />
          </div>

          {data.attempts.length > 0 && (
            <div className="border rounded-lg p-5 bg-card">
              <div className="font-display font-semibold text-sm mb-2">Delivery attempts</div>
              <div className="space-y-2">
                {data.attempts.map((a: any) => (
                  <div key={a.id} className="text-xs border rounded-md p-2.5">
                    <div className="font-medium">Attempt #{a.attemptNumber} · <span className="capitalize">{a.outcome.replace(/_/g, " ")}</span></div>
                    {a.reason && <div className="text-muted-foreground mt-0.5">{a.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
