import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments, useAgents, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Truck, Search, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch Center — Hub Operations" },
      { name: "description", content: "Manage outbound parcel queues and real driver assignments from the live database." },
    ],
  }),
  component: HubDispatchPage,
});

const DISPATCHABLE_STATUSES = ["arrived_hub", "picked_up", "in_transit"];

function HubDispatchPage() {
  const { data: hubShipments = [], isLoading } = useShipments("hub");
  const { data: agents = [] } = useAgents();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAgentByShipment, setSelectedAgentByShipment] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return hubShipments.filter((s: any) => {
      const matchesSearch =
        s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverCity.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hubShipments, search, statusFilter]);

  const stats = useMemo(() => {
    const total = hubShipments.length;
    const ready = hubShipments.filter((s: any) => s.status === "arrived_hub" && s.assignedAgentId).length;
    const dispatched = hubShipments.filter((s: any) => s.status === "out_for_delivery").length;
    const totalParcels = hubShipments.length;
    return { total, ready, dispatched, totalParcels };
  }, [hubShipments]);

  async function assignAndDispatch(shipmentId: string) {
    const agentId = selectedAgentByShipment[shipmentId];
    if (!agentId) {
      toast.error("Pick a delivery agent first");
      return;
    }
    setBusyId(shipmentId);
    try {
      const assignRes = await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!assignRes.ok) {
        const data = await assignRes.json().catch(() => ({}));
        toast.error(data.error || "Assign failed");
        return;
      }
      const statusRes = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "out_for_delivery", note: "Dispatched from hub." }),
      });
      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({}));
        toast.error(data.error || "Dispatch failed");
        return;
      }
      toast.success("Assigned and dispatched");
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
    } finally {
      setBusyId(null);
    }
  }

  async function dispatchOnly(shipmentId: string) {
    setBusyId(shipmentId);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "out_for_delivery", note: "Dispatched from hub." }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Dispatch failed");
        return;
      }
      toast.success("Dispatched");
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Dispatch Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real shipments at this hub — assign a delivery agent and dispatch, backed by the live database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            At This Hub <Truck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Assigned, Ready <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.ready}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Dispatched <Package className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.dispatched}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Packages <Package className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.totalParcels}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tracking ID, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="arrived_hub">Arrived at hub</SelectItem>
            <SelectItem value="out_for_delivery">Out for delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Destination</TableHead>
              <TableHead className="text-xs font-medium">Assigned Agent</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-64 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                  No shipments at this hub right now.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s: any) => {
              const agentName = agents.find((a: any) => a.id === s.assignedAgentId)?.name;
              return (
                <TableRow key={s.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3.5 font-mono font-semibold text-foreground text-xs">
                    {s.trackingId}
                  </TableCell>

                  <TableCell className="font-medium text-foreground text-xs">{s.receiverCity}</TableCell>

                  <TableCell>
                    {agentName ? (
                      <div className="font-medium text-foreground">{agentName}</div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.status === "out_for_delivery" || s.status === "delivered"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <Badge variant="outline" className="font-normal text-[11px] capitalize">
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    {DISPATCHABLE_STATUSES.includes(s.status) && !s.assignedAgentId && (
                      <div className="flex justify-end items-center gap-2">
                        <Select
                          value={selectedAgentByShipment[s.id] ?? ""}
                          onValueChange={(v) => setSelectedAgentByShipment((prev) => ({ ...prev, [s.id]: v }))}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue placeholder="Pick agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((a: any) => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={busyId === s.id}
                          onClick={() => assignAndDispatch(s.id)}
                        >
                          Assign & dispatch
                        </Button>
                      </div>
                    )}
                    {DISPATCHABLE_STATUSES.includes(s.status) && s.assignedAgentId && (
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        disabled={busyId === s.id}
                        onClick={() => dispatchOnly(s.id)}
                      >
                        Dispatch
                      </Button>
                    )}
                    {(s.status === "out_for_delivery" || s.status === "delivered") && (
                      <Badge variant="outline" className="font-normal text-[11px]">
                        {s.status === "delivered" ? "Delivered" : "Dispatched"}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
