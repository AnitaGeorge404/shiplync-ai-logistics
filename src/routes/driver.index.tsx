import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useShipments } from "@/lib/api-hooks";
import {
  overviewCounts,
  sortByPriorityAndEta,
  formatEta,
  fullAddress,
  mapsHref,
  telHref,
  NEXT_STATUS,
  type RealShipment,
} from "@/lib/driver";
import { StatusTag, PriorityTag } from "@/components/shiplync/driver/Tags";
import { OverviewStrip } from "@/components/shiplync/driver/OverviewStrip";
import { DeliveryRow } from "@/components/shiplync/driver/DeliveryRow";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Navigation, Phone, Package, ChevronRight, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/driver/")({
  head: () => ({ meta: [{ title: "Today — Delivery Partner" }] }),
  component: DriverHome,
});

function DriverHome() {
  const [online, setOnline] = useState(true);
  const { data: assigned = [], isLoading } = useShipments("assigned") as {
    data: RealShipment[];
    isLoading: boolean;
  };
  const counts = overviewCounts(assigned);
  const ordered = sortByPriorityAndEta(
    assigned.filter(
      (s) => s.status !== "delivered" && s.status !== "returned" && s.status !== "cancelled",
    ),
  );
  const next = ordered[0];
  const upcoming = ordered.slice(1, 6);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">What's next</div>
          <h1 className="font-display text-xl font-semibold mt-0.5">
            {ordered.length} stop{ordered.length === 1 ? "" : "s"} remaining
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${online ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`}
          />
          <span className="text-xs font-medium">{online ? "On duty" : "Off duty"}</span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </div>
      </div>

      {isLoading ? (
        <OverviewSkeleton />
      ) : (
        <OverviewStrip
          items={[
            { label: "Assigned", value: counts.assigned },
            { label: "Pending", value: counts.pending },
            { label: "Completed", value: counts.completed, tone: "success" },
            {
              label: "Failed",
              value: counts.failed,
              tone: counts.failed > 0 ? "danger" : "neutral",
            },
            {
              label: "Priority",
              value: counts.priority,
              tone: counts.priority > 0 ? "warning" : "neutral",
            },
          ]}
        />
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Next delivery
        </div>
        {!isLoading && !next && <AllDoneCard />}
        {next && <NextDeliveryCard shipment={next} />}
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Then
            </div>
            <Link
              to="/driver/my-route"
              className="text-xs text-primary font-medium hover:underline"
            >
              Full route →
            </Link>
          </div>
          <div className="border rounded-lg bg-card divide-y overflow-hidden">
            {upcoming.map((s, i) => (
              <DeliveryRow key={s.id} shipment={s} index={i + 2} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && assigned.length === 0 && (
        <div className="border rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No shipments assigned yet. New assignments will appear here.
        </div>
      )}
    </div>
  );
}

function NextDeliveryCard({ shipment: s }: { shipment: RealShipment }) {
  const next = NEXT_STATUS[s.status];
  const primaryLabel = next
    ? next.label
    : s.status === "out_for_delivery"
      ? "Complete delivery"
      : "Follow up";
  return (
    <div className="border-2 border-primary/40 rounded-xl bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-base truncate">{s.receiverName}</span>
            <PriorityTag shipment={s} />
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{fullAddress(s)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-mono text-muted-foreground">{s.trackingId}</span>
        <StatusTag status={s.status} />
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Package className="h-3 w-3" /> {s.weightKg} kg · {s.packageType}
        </span>
      </div>

      <div className="text-xs font-medium text-foreground">{formatEta(s)}</div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={telHref(s.receiverPhone)}
          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <a
          href={mapsHref(fullAddress(s))}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
        >
          <Navigation className="h-3.5 w-3.5" /> Navigate
        </a>
      </div>

      <Link to="/driver/shipment/$id" params={{ id: s.id }} className="block">
        <Button className="w-full h-11 gap-1.5">
          {primaryLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

function AllDoneCard() {
  return (
    <div className="border rounded-xl bg-card p-6 text-center">
      <PartyPopper className="h-6 w-6 mx-auto text-success" />
      <div className="mt-2 text-sm font-medium">All caught up</div>
      <div className="text-xs text-muted-foreground mt-0.5">No pending stops right now.</div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-5 border rounded-lg bg-card divide-x overflow-hidden animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-2.5 py-3 text-center">
          <div className="h-5 w-6 bg-muted rounded mx-auto" />
          <div className="h-2 w-10 bg-muted rounded mx-auto mt-2" />
        </div>
      ))}
    </div>
  );
}
