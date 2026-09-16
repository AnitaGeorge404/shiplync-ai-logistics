import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useShipments, useAgents, useExceptions, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { HeartPulse, ShieldCheck, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/medical")({
  head: () => ({
    meta: [
      { title: "Priority Queue — Hub Operations" },
      { name: "description", content: "Medical, critical and delayed shipments at this hub — dedicated handling lane and rider dispatch." },
    ],
  }),
  component: HubMedicalPage,
});

type Reason = "medical" | "critical" | "delayed";

function usePriorityQueue() {
  const { data: hubShipments = [] } = useShipments("hub");
  const { data: exceptions = [] } = useExceptions();

  return useMemo(() => {
    const active = hubShipments.filter((s: any) => s.status !== "delivered" && s.status !== "cancelled");
    const delayedShipmentIds = new Set(
      exceptions.filter((e: any) => e.type === "delayed_beyond_threshold").map((e: any) => e.shipmentId),
    );

    return active
      .map((s: any) => {
        const reasons: Reason[] = [];
        if (s.packageType === "medical") reasons.push("medical");
        if (s.priority === "critical") reasons.push("critical");
        if (delayedShipmentIds.has(s.id)) reasons.push("delayed");
        return { shipment: s, reasons };
      })
      .filter((row) => row.reasons.length > 0);
  }, [hubShipments, exceptions]);
}

const REASON_LABEL: Record<Reason, string> = { medical: "Medical", critical: "Critical", delayed: "Delayed" };
const REASON_STYLE: Record<Reason, string> = {
  medical: "bg-medical/10 text-medical border-medical/25",
  critical: "bg-destructive/10 text-destructive border-destructive/25",
  delayed: "bg-warning/10 text-warning-foreground border-warning/25",
};

function HubMedicalPage() {
  const queue = usePriorityQueue();
  const { data: agents = [] } = useAgents();
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");

  const handleAssignRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId || !selectedRiderId) return;

    const res = await fetch(`/api/shipments/${selectedShipmentId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: selectedRiderId }),
    });
    if (!res.ok) {
      toast.error("Could not assign rider");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
    setIsAssignOpen(false);
    toast.success("Assigned dedicated rider");
  };

  const medicalCount = queue.filter((r) => r.reasons.includes("medical")).length;
  const criticalCount = queue.filter((r) => r.reasons.includes("critical")).length;
  const delayedCount = queue.filter((r) => r.reasons.includes("delayed")).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Priority Queue
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-destructive/30 text-destructive bg-destructive/10">
              <Lock className="h-3 w-3" /> PRIORITY LOCKED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Medical, critical, and delayed shipments at this hub — dedicated handling lane.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Priority Queue <HeartPulse className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{queue.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Critical <Lock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{criticalCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Delayed <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{delayedCount}</div>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Consignment</TableHead>
              <TableHead className="text-xs font-medium">Reason</TableHead>
              <TableHead className="text-xs font-medium">Target Delivery SLA</TableHead>
              <TableHead className="text-xs font-medium">Rider</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-28 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  No medical, critical, or delayed shipments at this hub.
                </TableCell>
              </TableRow>
            )}
            {queue.map(({ shipment: m, reasons }) => (
              <TableRow key={m.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5 font-mono font-semibold text-foreground text-xs">
                  <Link to="/hub/shipments/$trackingId" params={{ trackingId: m.trackingId }} className="hover:underline">
                    {m.trackingId}
                  </Link>
                </TableCell>

                <TableCell className="font-medium text-foreground text-xs">
                  {m.weightKg} kg to {m.receiverCity}
                </TableCell>

                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {reasons.map((r) => (
                      <span key={r} className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${REASON_STYLE[r]}`}>
                        {REASON_LABEL[r]}
                      </span>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.estimatedDeliveryAt ? new Date(m.estimatedDeliveryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.assignedAgentId ? agents.find((a: any) => a.id === m.assignedAgentId)?.name ?? "Assigned" : "Unassigned"}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] capitalize">
                    {m.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  {!m.assignedAgentId && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedShipmentId(m.id);
                        setSelectedRiderId(agents[0]?.id ?? "");
                        setIsAssignOpen(true);
                      }}
                    >
                      Assign Rider
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Dedicated Rider</DialogTitle>
            <DialogDescription>
              Assign a dedicated rider for this priority consignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRiderSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Rider</Label>
              <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Assign Rider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
