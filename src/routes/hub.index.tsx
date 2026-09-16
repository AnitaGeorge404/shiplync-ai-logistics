import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { PriorityBadge } from "@/components/shiplync/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useShipments, useExceptions, useAgents, useHubs } from "@/lib/api-hooks";
import { useAuth } from "@/context/AuthContext";
import { PackageOpen, Inbox, Truck, AlertTriangle, HeartPulse, ScanLine, Warehouse, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/hub/")({
  component: HubDashboard,
});

export function HubDashboard() {
  const { user } = useAuth();
  const { data: hubShipments = [] } = useShipments("hub");
  const { data: exceptions = [] } = useExceptions();
  const { data: agents = [] } = useAgents();
  const { data: allHubs = [] } = useHubs();
  const { data: transfers = [] } = useShipments("hub_transfers");

  const myHub = allHubs.find((h: any) => h.id === user?.hubId);
  const incoming = hubShipments.filter((s: any) => ["picked_up", "in_transit"].includes(s.status));
  const arrived = hubShipments.filter((s: any) => s.status === "arrived_hub");
  const pendingIntake = arrived.filter((s: any) => !s.assignedAgentId);
  const pendingDispatch = arrived.filter((s: any) => !!s.assignedAgentId);
  const priorityShipments = hubShipments.filter(
    (s: any) => !["delivered", "cancelled", "returned"].includes(s.status) && (s.packageType === "medical" || s.priority !== "normal" || s.elderlyCare),
  );
  // Real per-hub loadPct (active shipments vs declared capacity, from
  // GET /api/hubs) when we know which hub this is — falls back to the
  // on-floor heuristic only if the account has no hub assigned.
  const loadPct = myHub ? myHub.loadPct : hubShipments.length > 0 ? Math.min(100, Math.round((arrived.length / hubShipments.length) * 100)) : 0;
  const outboundTransfers = transfers.filter((s: any) => s.currentHubId === user?.hubId);
  const inboundTransfers = transfers.filter((s: any) => s.destinationHubId === user?.hubId && s.currentHubId !== user?.hubId);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{myHub ? `${myHub.code} · ${myHub.city}` : "Hub operations"}</div>
        <h1 className="text-2xl font-semibold mt-1">
          Sorting bay — {arrived.length} on floor{myHub ? ` · ${myHub.loadPct}% capacity` : ""}
        </h1>
      </div>

      {/* Level 1 — operational queues at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Incoming" value={String(incoming.length)} icon={<Inbox />} />
        <StatCard label="Pending intake" value={String(pendingIntake.length)} icon={<PackageOpen />} />
        <StatCard label="Priority" value={String(priorityShipments.length)} icon={<HeartPulse />} tone={priorityShipments.length > 0 ? "warning" : "default"} />
        <StatCard label="Pending dispatch" value={String(pendingDispatch.length)} icon={<Truck />} />
        <StatCard label="Exceptions" value={String(exceptions.length)} icon={<AlertTriangle />} tone={exceptions.length > 0 ? "destructive" : "default"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pending intake queue */}
        <div className="lg:col-span-2 card-elevated overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Pending intake</div>
            <Button size="sm" variant="outline" className="gap-1.5" asChild><Link to="/hub/intake"><ScanLine className="h-3.5 w-3.5" /> Open scanner</Link></Button>
          </div>
          <div className="divide-y">
            {pendingIntake.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Nothing waiting on intake.</div>}
            {pendingIntake.slice(0, 8).map((r: any) => (
              <Link
                key={r.id}
                to="/hub/shipments/$trackingId"
                params={{ trackingId: r.trackingId }}
                className="grid grid-cols-12 items-center gap-2 px-4 py-2.5 text-xs hover:bg-muted/30"
              >
                <div className="col-span-3 font-mono">{r.trackingId}</div>
                <div className="col-span-3">{r.senderCity} → {r.receiverCity}</div>
                <div className="col-span-2 capitalize text-muted-foreground">{r.packageType}</div>
                <div className="col-span-2 text-muted-foreground">{r.weightKg} kg</div>
                <div className="col-span-2 flex justify-end">
                  {(r.packageType === "medical" || r.priority !== "normal") && (
                    <span className="rounded-sm bg-medical/10 text-medical border border-medical/25 px-1.5 py-0.5 text-[10px] font-medium capitalize">{r.priority !== "normal" ? r.priority : "Medical"}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority queue */}
        <div className="card-elevated overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-semibold"><HeartPulse className="h-3.5 w-3.5 text-medical" /> Priority shipments</div>
          <div className="divide-y">
            {priorityShipments.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground px-4">No priority shipments at this hub.</div>}
            {priorityShipments.slice(0, 6).map((s: any) => (
              <Link key={s.id} to="/hub/shipments/$trackingId" params={{ trackingId: s.trackingId }} className="block px-4 py-2.5 text-xs hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="font-mono">{s.trackingId}</span>
                  {s.packageType === "medical" ? (
                    <span className="rounded-sm bg-medical/10 text-medical border border-medical/25 px-1.5 py-0.5 text-[10px] font-medium">Medical</span>
                  ) : (
                    <PriorityBadge priority={s.priority} />
                  )}
                </div>
                <div className="text-muted-foreground mt-0.5 capitalize">{s.status.replace(/_/g, " ")} · {s.receiverCity}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pending dispatch queue */}
      <div className="card-elevated overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">Pending dispatch</div>
          <Button size="sm" variant="outline" asChild><Link to="/hub/dispatch">Open dispatch center</Link></Button>
        </div>
        <div className="divide-y">
          {pendingDispatch.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Dispatch queue is empty.</div>}
          {pendingDispatch.slice(0, 8).map((d: any) => {
            const agent = agents.find((a: any) => a.id === d.assignedAgentId);
            return (
              <Link
                key={d.id}
                to="/hub/shipments/$trackingId"
                params={{ trackingId: d.trackingId }}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs hover:bg-muted/30"
              >
                <div className="col-span-3 font-mono">{d.trackingId}</div>
                <div className="col-span-3">{d.receiverCity}</div>
                <div className="col-span-3 text-muted-foreground">{agent?.name ?? "Unassigned"}</div>
                <div className="col-span-3 flex justify-end">
                  <span className="rounded-sm bg-success/10 text-success border border-success/25 px-1.5 py-0.5 text-[10px] font-medium">Ready</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Current hub load */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Warehouse className="h-3.5 w-3.5" /> Current hub load</div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {myHub ? `${myHub.activeShipmentCount} active / ${myHub.capacity.toLocaleString()} capacity` : `${arrived.length} on floor · ${hubShipments.length} total in scope`}
              </span>
              <span className={`font-mono font-medium ${loadPct > 85 ? "text-destructive" : loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{loadPct}%</span>
            </div>
            <Progress value={loadPct} className="h-1.5" />
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="text-xs font-medium flex items-center gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Hub transfers</div>
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" asChild><Link to="/hub/transfers">Manage →</Link></Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="border rounded-md p-2.5">
              <div className="text-muted-foreground text-[10px]">Outbound</div>
              <div className="font-semibold text-base mt-0.5">{outboundTransfers.length}</div>
            </div>
            <div className="border rounded-md p-2.5">
              <div className="text-muted-foreground text-[10px]">Inbound</div>
              <div className="font-semibold text-base mt-0.5">{inboundTransfers.length}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">Network load — for redirecting overflow to neighboring hubs</div>
          <div className="mt-2 space-y-2.5">
            {allHubs.length === 0 && <div className="text-xs text-muted-foreground">No hubs registered yet.</div>}
            {allHubs.slice(0, 4).map((h: any) => (
              <div key={h.id}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code} <span className="text-muted-foreground font-normal">· {h.city}</span></div>
                  <div className={`font-mono ${h.loadPct > 85 ? "text-destructive" : h.loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.loadPct}%</div>
                </div>
                <Progress value={h.loadPct} className="h-1 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Exceptions */}
        <div className="card-elevated overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Exceptions</div>
          <div className="divide-y">
            {exceptions.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">No open exceptions.</div>}
            {exceptions.slice(0, 5).map((e: any) => (
              <div key={e.id} className="px-4 py-2.5 flex items-start gap-2.5 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
                <div>
                  <div className="font-medium capitalize">{e.type.replace(/_/g, " ")}</div>
                  <div className="text-muted-foreground">{e.message}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t"><Link to="/hub/exceptions" className="text-xs text-primary font-medium hover:underline">View all exceptions →</Link></div>
        </div>
      </div>
    </div>
  );
}
