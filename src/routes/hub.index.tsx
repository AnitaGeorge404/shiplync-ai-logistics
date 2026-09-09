import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/shiplync/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { hubs as mockHubs } from "@/lib/mock-data";
import { useShipments, useExceptions, useAgents } from "@/lib/api-hooks";
import { PackageCheck, PackageOpen, Truck, AlertTriangle, HeartPulse, ScanLine, ArrowRightLeft, UserCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/hub/")({
  component: HubDashboard,
});

export function HubDashboard() {
  const { data: hubShipments = [] } = useShipments("hub");
  const { data: exceptions = [] } = useExceptions();
  const { data: agents = [] } = useAgents();

  const incoming = hubShipments.filter((s: any) => ["booked", "payment_completed", "picked_up", "in_transit"].includes(s.status));
  const dispatchQueue = hubShipments.filter((s: any) => ["arrived_hub", "out_for_delivery"].includes(s.status));
  const dispatched = hubShipments.filter((s: any) => ["out_for_delivery", "delivered"].includes(s.status)).length;
  const medicalQueue = hubShipments.filter((s: any) => s.packageType === "medical" && s.status !== "delivered").length;
  const criticalExceptions = exceptions.filter((e: any) => e.severity === "critical").length;
  const loadPct = hubShipments.length > 0 ? Math.min(100, Math.round((incoming.length / hubShipments.length) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Live control room</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Sorting bay operating at {loadPct}% load</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Incoming" value={String(incoming.length)} icon={<PackageOpen />} />
        <StatCard label="Ready to dispatch" value={String(dispatchQueue.length)} icon={<Truck />} trend="flat" />
        <StatCard label="Dispatched" value={String(dispatched)} icon={<PackageCheck />} />
        <StatCard label="Exceptions" value={String(exceptions.length)} delta={`${criticalExceptions} critical`} trend="down" icon={<AlertTriangle />} />
        <StatCard label="Medical queue" value={String(medicalQueue)} hint="Priority-locked" icon={<HeartPulse />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Incoming shipments · next 60 min</div>
            <Button size="sm" variant="outline" className="gap-1.5"><ScanLine className="h-3.5 w-3.5" /> Open scanner</Button>
          </div>
          <div className="divide-y">
            {incoming.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No incoming shipments right now.</div>}
            {incoming.map((r: any) => (
              <div key={r.id} className="grid grid-cols-12 items-center gap-3 py-3">
                <div className="col-span-3 font-mono text-xs">{r.trackingId}</div>
                <div className="col-span-2 text-sm">{r.senderCity}</div>
                <div className="col-span-2 text-xs capitalize">{r.packageType}{r.packageType === "medical" && <span className="ml-2 rounded-full bg-medical/10 text-medical border border-medical/20 px-2 py-0.5 text-[10px] font-medium">Medical</span>}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{r.weightKg} kg</div>
                <div className="col-span-2 text-xs capitalize">{r.status.replace(/_/g, " ")}</div>
                <div className="col-span-1 flex justify-end"><Button size="sm" variant="ghost" asChild><a href="/hub/intake">Receive</a></Button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 bg-muted/40">
          <div className="flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> AI dispatch assistant</div>
          <div className="mt-3 rounded-lg border bg-card p-3 text-sm">
            <div className="font-medium">"Deliver these 42 packages before 8 PM"</div>
            <div className="text-xs text-muted-foreground mt-1">AI clustered 42 stops into 6 routes, assigned 5 drivers, minimized 18.2 km.</div>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Routes generated</span><span className="font-medium">6</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Drivers assigned</span><span className="font-medium">5</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est completion</span><span className="font-medium text-success">7:42 PM</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fuel saved</span><span className="font-medium text-success">3.4 L</span></div>
          </div>
          <Button className="mt-4 w-full">Approve & dispatch</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Dispatch queue</div>
            <Button size="sm" variant="outline" className="gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5" /> Reassign</Button>
          </div>
          <div className="divide-y">
            {dispatchQueue.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Dispatch queue is empty.</div>}
            {dispatchQueue.map((d: any) => (
              <div key={d.id} className="grid grid-cols-12 gap-2 py-3 items-center">
                <div className="col-span-3 font-mono text-xs">{d.trackingId}</div>
                <div className="col-span-3 text-sm">{d.receiverCity}</div>
                <div className="col-span-3 text-xs">{d.assignedAgentId ? "Assigned" : "Unassigned"}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{d.assignedVehicleId ? "Assigned" : "—"}</div>
                <div className="col-span-1 text-right">
                  <span className={`text-[10px] rounded-full px-2 py-0.5 border capitalize ${
                    d.status === "arrived_hub" ? "bg-success/10 text-success border-success/20"
                    : "bg-muted text-muted-foreground border-border"
                  }`}>{d.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="font-display font-semibold">Hub load balancing</div>
          <div className="text-xs text-muted-foreground">Redirecting shipments when neighboring hubs are congested</div>
          <div className="mt-4 space-y-3">
            {mockHubs.map((h) => (
              <div key={h.code}>
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium">{h.code} <span className="text-muted-foreground font-normal">· {h.city}</span></div>
                  <div className={`font-mono ${h.load > 85 ? "text-destructive" : h.load > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.load}%</div>
                </div>
                <Progress value={h.load} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b font-display font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4" /> Available delivery partners</div>
        <div className="divide-y">
          {agents.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground px-5">No delivery agents registered yet.</div>}
          {agents.map((d: any) => (
            <div key={d.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
              <div className="col-span-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">{d.name.split(" ").map((w: string) => w[0]).join("")}</div>
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.phone}</div>
                </div>
              </div>
              <div className="col-span-5 text-xs text-muted-foreground">Agent ID: {d.id.slice(0, 8)}</div>
              <div className="col-span-2 flex justify-end"><Button size="sm" variant="outline" asChild><a href="/hub/dispatch">Assign</a></Button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
