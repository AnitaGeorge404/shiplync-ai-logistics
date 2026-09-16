import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useShipments } from "@/lib/api-hooks";
import {
  sortByPriorityAndEta,
  formatEta,
  fullAddress,
  mapsHref,
  telHref,
  type RealShipment,
} from "@/lib/driver";
import { StatusTag, PriorityTag } from "@/components/shiplync/driver/Tags";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Navigation,
  Phone,
  PartyPopper,
} from "lucide-react";

export const Route = createFileRoute("/driver/my-route")({
  head: () => ({
    meta: [
      { title: "My Route — Delivery Partner" },
      {
        name: "description",
        content: "Today's stop sequence — next delivery, upcoming stops, and completed drops.",
      },
    ],
  }),
  component: DriverRoutePage,
});

function DriverRoutePage() {
  const { data: assigned = [], isLoading } = useShipments("assigned") as {
    data: RealShipment[];
    isLoading: boolean;
  };
  const [showCompleted, setShowCompleted] = useState(false);

  const active = sortByPriorityAndEta(
    assigned.filter(
      (s) => s.status !== "delivered" && s.status !== "returned" && s.status !== "cancelled",
    ),
  );
  const completed = assigned.filter((s) => s.status === "delivered" || s.status === "returned");
  const next = active[0];
  const upcoming = active.slice(1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">My route</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suggested order based on priority and delivery ETA · {active.length} stop
          {active.length === 1 ? "" : "s"} left, {completed.length} done
        </p>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading route…</div>
      )}

      {!isLoading && !next && active.length === 0 && (
        <div className="border rounded-xl bg-card p-6 text-center">
          <PartyPopper className="h-6 w-6 mx-auto text-success" />
          <div className="mt-2 text-sm font-medium">Route complete</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Every assigned stop has been resolved.
          </div>
        </div>
      )}

      {next && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Next stop
          </div>
          <div className="border-2 border-primary/40 rounded-xl bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-base truncate">
                    {next.receiverName}
                  </span>
                  <PriorityTag shipment={next} />
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">{fullAddress(next)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-mono text-muted-foreground">{next.trackingId}</span>
              <StatusTag status={next.status} />
              <span className="text-muted-foreground">{formatEta(next)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={telHref(next.receiverPhone)}
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a
                href={mapsHref(fullAddress(next))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
              >
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </a>
            </div>
            <Link to="/driver/shipment/$id" params={{ id: next.id }} className="block">
              <Button className="w-full h-11 gap-1.5">
                Open shipment <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Upcoming ({upcoming.length})
          </div>
          <div className="border rounded-lg bg-card divide-y overflow-hidden">
            {upcoming.map((s, i) => (
              <StopRow key={s.id} shipment={s} index={i + 2} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showCompleted ? "" : "-rotate-90"}`}
            />
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="border rounded-lg bg-card divide-y overflow-hidden opacity-70">
              {completed.map((s) => (
                <StopRow key={s.id} shipment={s} done />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StopRow({
  shipment: s,
  index,
  done,
}: {
  shipment: RealShipment;
  index?: number;
  done?: boolean;
}) {
  return (
    <Link
      to="/driver/shipment/$id"
      params={{ id: s.id }}
      className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40 active:bg-muted/60"
    >
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
      ) : (
        <div className="h-6 w-6 shrink-0 rounded-full border grid place-items-center text-[11px] font-semibold text-muted-foreground">
          {index}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{s.receiverName}</span>
          <PriorityTag shipment={s} />
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {s.receiverAddressLine}, {s.receiverCity}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 font-mono">{s.trackingId}</div>
      </div>
      <div className="text-right shrink-0">
        <StatusTag status={s.status} />
      </div>
    </Link>
  );
}
