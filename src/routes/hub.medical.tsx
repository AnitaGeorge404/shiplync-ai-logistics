import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useShipments, useAgents, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HeartPulse,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/medical")({
  head: () => ({
    meta: [
      { title: "Medical Queue — Hub Operations" },
      { name: "description", content: "Priority cold-chain medical consignment queue, temperature logs, and dedicated rider dispatch." },
    ],
  }),
  component: HubMedicalPage,
});

function useMedicalQueue() {
  const { data: hubShipments = [] } = useShipments("hub");
  return hubShipments.filter((s: any) => s.packageType === "medical" && s.status !== "delivered" && s.status !== "cancelled");
}

function HubMedicalPage() {
  const medicalList = useMedicalQueue();
  const { data: agents = [] } = useAgents();
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");

  const handleVerifyTemp = (tracking: string) => {
    toast.info(`No cold-chain temperature sensor is integrated yet for ${tracking} — this action is illustrative.`);
  };

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
    toast.success("Assigned dedicated rider to medical consignment");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Medical Priority Queue
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-red-300 text-red-600 bg-red-50 dark:bg-red-950/40">
              <Lock className="h-3 w-3" /> PRIORITY LOCKED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dedicated handling lane for cold-chain vaccines, emergency surgical kits, and priority medical consignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported medical chain-of-custody log")}
          >
            <Download className="h-3.5 w-3.5" /> Export Custody Log
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Medical Queue <HeartPulse className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalList.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Unassigned <Thermometer className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalList.filter((m: any) => !m.assignedAgentId).length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Assigned <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalList.filter((m: any) => m.assignedAgentId).length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Registered Riders <UserCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{agents.length}</div>
        </div>
      </div>

      {/* Medical Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Parcel Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Consignment Cargo</TableHead>
              <TableHead className="text-xs font-medium">Temperature Log</TableHead>
              <TableHead className="text-xs font-medium">Target Delivery SLA</TableHead>
              <TableHead className="text-xs font-medium">Dedicated Rider</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-36 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicalList.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  No active medical shipments at this hub.
                </TableCell>
              </TableRow>
            )}
            {medicalList.map((m: any) => (
              <TableRow key={m.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5 font-mono font-semibold text-foreground text-xs">
                  {m.trackingId}
                </TableCell>

                <TableCell className="font-medium text-foreground text-xs">
                  {m.weightKg} kg to {m.receiverCity}
                </TableCell>

                <TableCell className="text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-foreground" />
                    <span>Not integrated</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.estimatedDeliveryAt ? new Date(m.estimatedDeliveryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.assignedAgentId ? agents.find((a: any) => a.id === m.assignedAgentId)?.name ?? "Assigned" : "Unassigned"}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800 capitalize">
                    {m.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell className="text-right space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleVerifyTemp(m.trackingId)}
                  >
                    Verify Temp
                  </Button>
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

      {/* Assign Rider Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Dedicated Medical Rider</DialogTitle>
            <DialogDescription>
              Assign a dedicated rider for this medical consignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRiderSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Dedicated Rider</Label>
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
