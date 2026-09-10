import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ListChecks, Search, CheckCircle2, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";

type RealAssignedShipment = {
  id: string;
  trackingId: string;
  receiverName: string;
  receiverAddressLine: string;
  receiverCity: string;
  status: string;
  cost: number;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
};

function useAssignedShipments() {
  return useQuery({
    queryKey: ["shipments", "assigned"],
    queryFn: async (): Promise<RealAssignedShipment[]> => {
      const res = await fetch("/api/shipments?scope=assigned");
      if (!res.ok) return [];
      const data = await res.json();
      return data.shipments ?? [];
    },
    refetchInterval: 5000,
  });
}

const NEXT_STATUS: Record<string, { label: string; status: string } | null> = {
  booked: { label: "Mark picked up", status: "picked_up" },
  payment_completed: { label: "Mark picked up", status: "picked_up" },
  picked_up: { label: "Mark out for delivery", status: "out_for_delivery" },
  arrived_hub: { label: "Mark out for delivery", status: "out_for_delivery" },
  in_transit: { label: "Mark out for delivery", status: "out_for_delivery" },
  out_for_delivery: null, // resolved via delivery attempt below
  delivery_attempted: null,
  delivered: null,
  returned: null,
  cancelled: null,
};

export const Route = createFileRoute("/driver/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Delivery Partner" },
      { name: "description", content: "All assigned deliveries, completed drop-offs, and proof of delivery." },
    ],
  }),
  component: DriverDeliveriesPage,
});

function DriverDeliveriesPage() {
  const { data: shipments = [], isLoading } = useAssignedShipments();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function advanceStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note: `Updated by delivery agent to ${status}.` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not update status");
        return;
      }
      toast.success(`Status updated to "${status.replace(/_/g, " ")}"`);
      queryClient.invalidateQueries({ queryKey: ["shipments", "assigned"] });
    } finally {
      setBusyId(null);
    }
  }

  async function recordAttempt(id: string, outcome: "delivered" | "receiver_unavailable") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/shipments/${id}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          outcome,
          reason: outcome === "delivered" ? "Delivered to recipient." : "Recipient not available.",
          otpVerified: outcome === "delivered",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not record delivery attempt");
        return;
      }
      toast.success(outcome === "delivered" ? "Marked as delivered" : "Failed attempt logged");
      queryClient.invalidateQueries({ queryKey: ["shipments", "assigned"] });
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchesSearch =
        s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverName.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverAddressLine.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "Completed" && s.status === "delivered") ||
        (statusFilter === "Pending" && s.status !== "delivered" && s.status !== "delivery_attempted") ||
        (statusFilter === "Attempted" && s.status === "delivery_attempted");
      return matchesSearch && matchesStatus;
    });
  }, [shipments, search, statusFilter]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const completed = shipments.filter((s) => s.status === "delivered").length;
    const pending = shipments.filter((s) => s.status !== "delivered").length;
    const revenue = shipments.filter((s) => s.status === "delivered").reduce((acc, s) => acc + s.cost, 0);
    return { total, completed, pending, revenue };
  }, [shipments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Deliveries Summary
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real assigned shipments from the database — advance status, mark delivered, or log a failed attempt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Assigned <ListChecks className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Delivered <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.completed}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Remaining Drops <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.pending}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Delivered Value <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{stats.revenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tracking ID, recipient, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Drops</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Attempted">Attempted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking & ID</TableHead>
              <TableHead className="text-xs font-medium">Recipient & Location</TableHead>
              <TableHead className="text-xs font-medium">Value</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">ETA / Delivered</TableHead>
              <TableHead className="text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  No assigned shipments match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const next = NEXT_STATUS[s.status];
              return (
                <TableRow key={s.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">
                    {s.trackingId}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-foreground text-xs">{s.receiverName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.receiverAddressLine}, {s.receiverCity}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-medium">₹{s.cost}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.status === "delivered" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <Badge variant="outline" className="font-normal text-[11px] capitalize">
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {s.status === "delivered" && s.deliveredAt
                      ? new Date(s.deliveredAt).toLocaleString()
                      : s.estimatedDeliveryAt
                        ? new Date(s.estimatedDeliveryAt).toLocaleString()
                        : "TBD"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {next && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={busyId === s.id}
                          onClick={() => advanceStatus(s.id, next.status)}
                        >
                          {next.label}
                        </Button>
                      )}
                      {s.status === "out_for_delivery" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={busyId === s.id}
                            onClick={() => recordAttempt(s.id, "delivered")}
                          >
                            Delivered
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={busyId === s.id}
                            onClick={() => recordAttempt(s.id, "receiver_unavailable")}
                          >
                            Failed attempt
                          </Button>
                        </>
                      )}
                    </div>
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
