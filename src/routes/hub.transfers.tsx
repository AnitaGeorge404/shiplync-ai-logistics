import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useShipments, useHubs, useQueryClient } from "@/lib/api-hooks";
import { useAuth } from "@/context/AuthContext";
import { usePagedRows } from "@/hooks/use-paged-rows";
import { PriorityBadge } from "@/components/shiplync/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { ArrowLeftRight, ArrowRight, PackageOpen, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/transfers")({
  head: () => ({
    meta: [
      { title: "Hub Transfers — Hub Operations" },
      { name: "description", content: "Real hub-to-hub shipment transfers — outbound and inbound, backed by the live database." },
    ],
  }),
  component: HubTransfersPage,
});

const READY_STATUSES = ["arrived_hub", "picked_up"];

function HubTransfersPage() {
  const { user } = useAuth();
  const myHubId = user?.hubId;
  const { data: hubShipments = [], isLoading: loadingHub } = useShipments("hub");
  const { data: transfers = [], isLoading: loadingTransfers } = useShipments("hub_transfers");
  const { data: hubs = [] } = useHubs();
  const queryClient = useQueryClient();
  const [destByShipment, setDestByShipment] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const hubById = useMemo(() => new Map(hubs.map((h: any) => [h.id, h])), [hubs]);
  const otherHubs = hubs.filter((h: any) => h.id !== myHubId);

  const readyToTransfer = hubShipments.filter(
    (s: any) => READY_STATUSES.includes(s.status) && !s.destinationHubId,
  );
  const outbound = transfers.filter((s: any) => s.currentHubId === myHubId);
  const inbound = transfers.filter((s: any) => s.destinationHubId === myHubId && s.currentHubId !== myHubId);

  const readyPaged = usePagedRows(readyToTransfer, 8);
  const transfersPaged = usePagedRows(transfers, 10);

  async function startTransfer(shipmentId: string) {
    const destinationHubId = destByShipment[shipmentId];
    if (!destinationHubId) {
      toast.error("Pick a destination hub first");
      return;
    }
    setBusyId(shipmentId);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/transfer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destinationHubId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Transfer failed");
        return;
      }
      toast.success(`${data.shipment.trackingId} transferred — in transit`);
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub_transfers"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Hub Transfers</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real hub-to-hub movement — starting a transfer here writes to the live database and follows the shipment until the receiving hub scans it in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Ready to Transfer <PackageOpen className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{readyToTransfer.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Outbound In Transit <ArrowUpRight className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{outbound.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Inbound Expected <ArrowDownLeft className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{inbound.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">Ready to transfer</h2>
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                <TableHead className="text-xs font-medium">Destination city</TableHead>
                <TableHead className="text-xs font-medium">Priority</TableHead>
                <TableHead className="w-72 text-right text-xs font-medium">Transfer to hub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loadingHub && readyPaged.pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                    Nothing at this hub is ready to transfer right now.
                  </TableCell>
                </TableRow>
              )}
              {readyPaged.pageRows.map((s: any) => (
                <TableRow key={s.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3">
                    <Link to="/hub/shipments/$trackingId" params={{ trackingId: s.trackingId }} className="font-mono font-semibold text-foreground hover:underline">
                      {s.trackingId}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{s.receiverCity}</TableCell>
                  <TableCell><PriorityBadge priority={s.priority} /></TableCell>
                  <TableCell className="text-right">
                    {otherHubs.length === 0 ? (
                      <span className="text-muted-foreground italic">No other hubs registered</span>
                    ) : (
                      <div className="flex justify-end items-center gap-2">
                        <Select
                          value={destByShipment[s.id] ?? ""}
                          onValueChange={(v) => setDestByShipment((prev) => ({ ...prev, [s.id]: v }))}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Pick hub" />
                          </SelectTrigger>
                          <SelectContent>
                            {otherHubs.map((h: any) => (
                              <SelectItem key={h.id} value={h.id}>{h.code} · {h.city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-8 text-xs" disabled={busyId === s.id} onClick={() => startTransfer(s.id)}>
                          <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Transfer
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {readyPaged.pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              {Array.from({ length: readyPaged.pageCount }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === readyPaged.page} onClick={(e) => { e.preventDefault(); readyPaged.setPage(p); }} href="#">
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">Active transfers</h2>
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                <TableHead className="text-xs font-medium">Route</TableHead>
                <TableHead className="text-xs font-medium">Direction</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">Last update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loadingTransfers && transfersPaged.pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    No transfers in flight for this hub.
                  </TableCell>
                </TableRow>
              )}
              {transfersPaged.pageRows.map((s: any) => {
                const currentHub = hubById.get(s.currentHubId);
                const destHub = hubById.get(s.destinationHubId);
                const isOutbound = s.currentHubId === myHubId;
                return (
                  <TableRow key={s.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="py-3">
                      <Link to="/hub/shipments/$trackingId" params={{ trackingId: s.trackingId }} className="font-mono font-semibold text-foreground hover:underline">
                        {s.trackingId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{currentHub?.code ?? "—"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{destHub?.code ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[11px] gap-1">
                        {isOutbound ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {isOutbound ? "Outbound" : "Inbound"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        In transit
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(s.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {transfersPaged.pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              {Array.from({ length: transfersPaged.pageCount }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === transfersPaged.page} onClick={(e) => { e.preventDefault(); transfersPaged.setPage(p); }} href="#">
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
