import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHubs, useUsers, useVehicles, usePayments, toBadgeStatus } from "@/lib/api-hooks";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Timeline } from "@/components/shiplync/Timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Package, Truck, UserCheck, ShieldAlert, IndianRupee, Settings2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shipments/$trackingId")({
  head: () => ({
    meta: [{ title: "Shipment Detail — Admin Command Center" }],
  }),
  component: ShipmentDetailPage,
});

const PRIORITY_STYLES: Record<string, string> = {
  normal: "border-border text-muted-foreground",
  high: "border-warning/30 text-warning-foreground bg-warning/10",
  critical: "border-destructive/30 text-destructive bg-destructive/10",
};

// Mirrors ALLOWED_TRANSITIONS in src/lib/api-router.ts — the server is the
// real authority and re-validates every request; this is only used to decide
// which action buttons to show.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  booked: ["payment_completed", "picked_up", "arrived_hub", "cancelled"],
  payment_completed: ["picked_up", "arrived_hub", "cancelled"],
  picked_up: ["arrived_hub", "in_transit", "out_for_delivery", "cancelled"],
  arrived_hub: ["in_transit", "out_for_delivery", "cancelled"],
  in_transit: ["arrived_hub", "out_for_delivery"],
  out_for_delivery: ["delivery_attempted", "delivered", "returned"],
  delivery_attempted: ["out_for_delivery", "delivered", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

const OUTCOME_LABEL: Record<string, string> = {
  delivered: "Delivered",
  receiver_unavailable: "Receiver unavailable",
  address_issue: "Address issue",
  refused: "Refused",
  rescheduled: "Rescheduled",
  returned: "Returned",
};

function ShipmentDetailPage() {
  const { trackingId } = useParams({ from: "/admin/shipments/$trackingId" });
  const queryClient = useQueryClient();
  const { data: hubs = [] } = useHubs();
  const { data: users = [] } = useUsers();
  const { data: vehicles = [] } = useVehicles();
  const { data: allPayments = [] } = usePayments("all");
  const [agentPick, setAgentPick] = useState("");
  const [vehiclePick, setVehiclePick] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["shipment-detail", trackingId],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(trackingId)}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const shipment = data?.shipment;
  const events = data?.events ?? [];
  const attempts = data?.attempts ?? [];
  const exceptions = data?.exceptions ?? [];

  const hubById = new Map(hubs.map((h: any) => [h.id, h]));
  const agents = users.filter((u: any) => u.role === "delivery_agent");

  async function refreshAll() {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
  }

  async function handleAssign() {
    if (!shipment || (!agentPick && !vehiclePick)) {
      toast.error("Pick an agent or vehicle first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(agentPick ? { agentId: agentPick } : {}),
          ...(vehiclePick ? { vehicleId: vehiclePick } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Assignment failed");
        return;
      }
      toast.success("Assignment updated");
      setAgentPick("");
      setVehiclePick("");
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!shipment) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note: "Updated by admin." }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Status update failed");
        return;
      }
      toast.success(`Status changed to "${status.replace(/_/g, " ")}"`);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading shipment…</div>;
  }
  if (!shipment) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="text-sm text-muted-foreground">Shipment "{trackingId}" not found.</div>
        <Button variant="outline" size="sm" asChild><Link to="/admin/shipments">Back to shipments</Link></Button>
      </div>
    );
  }

  const originHub = shipment.originHubId ? hubById.get(shipment.originHubId) : null;
  const destinationHub = shipment.destinationHubId ? hubById.get(shipment.destinationHubId) : null;
  const currentHub = shipment.currentHubId ? hubById.get(shipment.currentHubId) : null;
  const agent = shipment.assignedAgentId ? users.find((u: any) => u.id === shipment.assignedAgentId) : null;
  const vehicle = shipment.assignedVehicleId ? vehicles.find((v: any) => v.id === shipment.assignedVehicleId) : null;
  const shipmentPayments = allPayments.filter((p: any) => p.shipmentId === shipment.id);
  const nextStatuses = ALLOWED_TRANSITIONS[shipment.status] ?? [];

  const timelineEvents = events.map((e: any) => ({
    key: e.id,
    label: e.status.replace(/_/g, " ").replace(/^./, (c: string) => c.toUpperCase()),
    time: new Date(e.createdAt).toLocaleString(),
    location: e.location ?? undefined,
    note: e.note ?? undefined,
    done: true,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/admin/shipments" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Shipments</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-foreground">{shipment.trackingId}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{shipment.trackingId}</h1>
            <StatusBadge status={toBadgeStatus(shipment.status)} />
            <Badge variant="outline" className={`text-[10px] capitalize font-normal ${PRIORITY_STYLES[shipment.priority] ?? ""}`}>
              {shipment.priority}
            </Badge>
            {shipment.packageType === "medical" && <Badge variant="outline" className="text-[10px]">Medical</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Booked {new Date(shipment.createdAt).toLocaleString()} · {shipment.senderCity} → {shipment.receiverCity}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Cost</div>
          <div className="text-xl font-semibold">₹{shipment.cost}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section icon={<MapPin className="h-4 w-4" />} title="Route">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <RoutePoint label="Origin" value={shipment.senderCity} sub={originHub?.code} />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <RoutePoint label="Current hub" value={currentHub?.name ?? data?.currentHubName ?? "In transit"} sub={currentHub?.code} highlight />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <RoutePoint label="Destination" value={shipment.receiverCity} sub={destinationHub?.code} />
            </div>
          </Section>

          <Section icon={<Package className="h-4 w-4" />} title="Package">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Field label="Weight" value={`${shipment.weightKg} kg`} />
              <Field label="Type" value={shipment.packageType} className="capitalize" />
              <Field
                label="Dimensions"
                value={shipment.lengthCm ? `${shipment.lengthCm}×${shipment.widthCm}×${shipment.heightCm} cm` : "—"}
              />
              <Field label="Insured" value={shipment.insured ? `Yes — ₹${shipment.declaredValue ?? 0}` : "No"} />
            </div>
          </Section>

          <Section title="Tracking timeline">
            {timelineEvents.length === 0 ? (
              <div className="text-xs text-muted-foreground">No events recorded yet.</div>
            ) : (
              <Timeline events={timelineEvents} />
            )}
          </Section>

          <Section icon={<UserCheck className="h-4 w-4" />} title="Delivery attempts">
            {attempts.length === 0 ? (
              <div className="text-xs text-muted-foreground">No delivery attempts recorded.</div>
            ) : (
              <div className="space-y-2">
                {attempts.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between border rounded-md p-3 text-xs">
                    <div>
                      <span className="font-medium">Attempt #{a.attemptNumber}</span>
                      <span className="text-muted-foreground"> — {OUTCOME_LABEL[a.outcome] ?? a.outcome}</span>
                      {a.reason && <div className="text-muted-foreground mt-0.5">{a.reason}</div>}
                    </div>
                    <div className="text-muted-foreground shrink-0">{new Date(a.attemptedAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={<ShieldAlert className="h-4 w-4" />} title="Exceptions">
            {exceptions.length === 0 ? (
              <div className="text-xs text-muted-foreground">No exceptions recorded for this shipment.</div>
            ) : (
              <div className="space-y-2">
                {exceptions.map((e: any) => (
                  <div key={e.id} className="flex items-start gap-2.5 border rounded-md p-3 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{e.type.replace(/_/g, " ")}</div>
                      <div className="text-muted-foreground">{e.message}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{e.resolved ? "Resolved" : "Open"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section icon={<Truck className="h-4 w-4" />} title="Assignment">
            <div className="space-y-2 text-sm">
              <Field label="Agent" value={agent ? `${agent.name}${agent.phone ? ` · ${agent.phone}` : ""}` : "Unassigned"} />
              <Field label="Vehicle" value={vehicle ? `${vehicle.registrationNumber} (${vehicle.type.replace(/_/g, " ")})` : "Unassigned"} />
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Reassign</div>
              <Select value={agentPick} onValueChange={setAgentPick}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick agent" /></SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={vehiclePick} onValueChange={setVehiclePick}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v: any) => (<SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button size="sm" className="w-full h-8 text-xs" disabled={busy || (!agentPick && !vehiclePick)} onClick={handleAssign}>
                Assign
              </Button>
            </div>
          </Section>

          <Section icon={<IndianRupee className="h-4 w-4" />} title="Financial">
            <Field label="Shipment cost" value={`₹${shipment.cost}`} />
            {shipmentPayments.length === 0 ? (
              <div className="text-xs text-muted-foreground mt-2">No payment records.</div>
            ) : (
              <div className="mt-2 space-y-2">
                {shipmentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs border rounded-md p-2.5">
                    <div>
                      <div className="font-mono">{p.transactionRef}</div>
                      <div className="text-muted-foreground capitalize">{p.method} · {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={<Settings2 className="h-4 w-4" />} title="Administrative actions">
            {nextStatuses.length === 0 ? (
              <div className="text-xs text-muted-foreground">This shipment is in a terminal state — no further transitions.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "returned" || s === "cancelled" ? "outline" : "default"}
                    className="h-8 text-xs capitalize"
                    disabled={busy}
                    onClick={() => handleStatusChange(s)}
                  >
                    Mark {s.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 text-sm font-semibold mb-3">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-medium mt-0.5 ${className ?? ""}`}>{value}</div>
    </div>
  );
}

function RoutePoint({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-lg px-3 py-2 ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium text-sm">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}
