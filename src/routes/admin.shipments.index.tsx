import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments, useHubs, useUsers, toBadgeStatus, toProgress, useQueryClient } from "@/lib/api-hooks";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  Truck,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  PackageCheck,
  Radio,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shipments/")({
  head: () => ({
    meta: [
      { title: "Shipment Management — Admin Command Center" },
      { name: "description", content: "Every shipment in the network — search, filter, sort and manage, from the live database." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { agent?: string } => ({
    agent: typeof search.agent === "string" ? search.agent : undefined,
  }),
  component: ShipmentManagementPage,
});

const PRIORITY_STYLES: Record<string, string> = {
  normal: "border-border text-muted-foreground",
  high: "border-warning/30 text-warning-foreground bg-warning/10",
  critical: "border-destructive/30 text-destructive bg-destructive/10",
};

const PAGE_SIZE = 15;
type SortKey = "createdAt" | "cost" | "priority";
const PRIORITY_RANK: Record<string, number> = { critical: 2, high: 1, normal: 0 };

function ShipmentManagementPage() {
  const navigate = useNavigate();
  const { agent: agentFromUrl } = useSearch({ from: "/admin/shipments/" });
  const { data: shipmentList = [], isLoading } = useShipments("all");
  const { data: hubs = [] } = useHubs();
  const { data: users = [] } = useUsers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [agentFilter, setAgentFilter] = useState<string>(agentFromUrl ?? "ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);

  const hubById = useMemo(() => new Map(hubs.map((h: any) => [h.id, h])), [hubs]);
  const userById = useMemo(() => new Map(users.map((u: any) => [u.id, u])), [users]);
  const agents = useMemo(() => users.filter((u: any) => u.role === "delivery_agent"), [users]);

  const filteredShipments = useMemo(() => {
    return shipmentList.filter((s: any) => {
      const matchesSearch =
        s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        s.senderCity.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverCity.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesType =
        typeFilter === "ALL" ? true : typeFilter === "medical" ? s.packageType === "medical" : s.packageType === typeFilter;
      const matchesAgent =
        agentFilter === "ALL" ? true : agentFilter === "UNASSIGNED" ? !s.assignedAgentId : s.assignedAgentId === agentFilter;

      return matchesSearch && matchesStatus && matchesType && matchesAgent;
    });
  }, [shipmentList, search, statusFilter, typeFilter, agentFilter]);

  const sortedShipments = useMemo(() => {
    const rows = [...filteredShipments];
    rows.sort((a: any, b: any) => {
      let cmp = 0;
      if (sort.key === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sort.key === "cost") cmp = a.cost - b.cost;
      else if (sort.key === "priority") cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filteredShipments, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedShipments = sortedShipments.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
    setPage(1);
  }

  const counts = useMemo(() => {
    return {
      total: shipmentList.length,
      inTransit: shipmentList.filter((s: any) => s.status === "in_transit").length,
      outForDelivery: shipmentList.filter((s: any) => s.status === "out_for_delivery").length,
      exceptions: shipmentList.filter((s: any) => s.status === "delivery_attempted" || s.status === "returned").length,
      medical: shipmentList.filter((s: any) => s.packageType === "medical").length,
    };
  }, [shipmentList]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shipments", "all"] });
    toast.success("Shipment data refreshed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Shipment Management</h1>
            <Badge variant="outline" className="text-[10px] gap-1 font-mono">
              <Radio className="h-3 w-3 text-success animate-pulse-dot" /> LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every shipment in the network, real-time from the database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" asChild>
            <a href="/api/reports/shipments.csv">Export CSV</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total <Package className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-semibold mt-1">{counts.total}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            In Transit <Truck className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-semibold mt-1">{counts.inTransit}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Out for Delivery <PackageCheck className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-semibold mt-1">{counts.outForDelivery}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Attempted / Returned <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-semibold mt-1 text-warning-foreground">{counts.exceptions}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-semibold mt-1">{counts.medical}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: "All" },
            { id: "in_transit", label: "In Transit" },
            { id: "out_for_delivery", label: "Out for Delivery" },
            { id: "arrived_hub", label: "At Hub" },
            { id: "delivery_attempted", label: "Attempted" },
            { id: "delivered", label: "Delivered" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setStatusFilter(t.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {agentFilter !== "ALL" && (
            <Badge variant="secondary" className="text-[10px] gap-1.5 h-8 px-2.5">
              Agent: {agentFilter === "UNASSIGNED" ? "Unassigned" : userById.get(agentFilter)?.name ?? "—"}
              <button onClick={() => setAgentFilter("ALL")} className="hover:text-foreground">×</button>
            </Badge>
          )}
          <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All agents</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {agents.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Package Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="medical">Medical Only</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="fragile">Fragile</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by tracking ID or city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Route</TableHead>
              <TableHead className="text-xs font-medium">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("priority")}>
                  Priority <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium">Hub</TableHead>
              <TableHead className="text-xs font-medium">Agent</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Progress</TableHead>
              <TableHead className="text-xs font-medium">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("createdAt")}>
                  Booked <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium">
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("cost")}>
                  Cost <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && pagedShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                  No shipments found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              pagedShipments.map((s: any) => {
                const hub = s.currentHubId ? hubById.get(s.currentHubId) : null;
                const agent = s.assignedAgentId ? userById.get(s.assignedAgentId) : null;
                return (
                  <TableRow key={s.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-3">
                      <div className="font-mono font-medium text-foreground text-xs">{s.trackingId}</div>
                      {s.packageType === "medical" && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground/30 mt-0.5">
                          Medical
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{s.senderCity} → {s.receiverCity}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize font-normal ${PRIORITY_STYLES[s.priority] ?? ""}`}>
                        {s.priority}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground">{hub ? hub.code : "—"}</TableCell>

                    <TableCell>
                      {agent ? (
                        <span className="text-foreground font-medium">{agent.name}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={toBadgeStatus(s.status)} />
                    </TableCell>

                    <TableCell className="w-28">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${toProgress(s.status)}%` }} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="font-medium text-foreground">₹{s.cost}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuLabel className="text-[11px] text-muted-foreground">{s.trackingId}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => navigate({ to: "/admin/shipments/$trackingId", params: { trackingId: s.trackingId } })}
                            className="gap-2 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate({ to: "/customer/track/$id", params: { id: s.trackingId } })}
                            className="gap-2 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View tracking page
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate({ to: "/hub/dispatch" })}
                            className="gap-2 text-xs"
                          >
                            <Truck className="h-3.5 w-3.5" /> Manage in Hub Dispatch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground">
          <div>
            Showing <strong>{pagedShipments.length}</strong> of <strong>{sortedShipments.length}</strong> shipments
            {sortedShipments.length !== shipmentList.length ? ` (${shipmentList.length} total)` : ""}
          </div>
          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className="h-8 text-xs px-2.5"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-xs">Page {pageSafe} of {totalPages}</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className="h-8 text-xs px-2.5"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
