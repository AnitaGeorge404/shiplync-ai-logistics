import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments, toBadgeStatus, toProgress, useQueryClient } from "@/lib/api-hooks";
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
import {
  Activity,
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
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/map")({
  head: () => ({
    meta: [
      { title: "Shipment Monitoring — Admin Command Center" },
      { name: "description", content: "Real-time monitoring table of active shipments and status updates, from the live database." },
    ],
  }),
  component: ShipmentMonitoringPage,
});

function ShipmentMonitoringPage() {
  const navigate = useNavigate();
  const { data: shipmentList = [], isLoading } = useShipments("all");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredShipments = useMemo(() => {
    return shipmentList.filter((s: any) => {
      const matchesSearch =
        s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        s.senderCity.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverCity.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesType =
        typeFilter === "ALL" ? true : typeFilter === "medical" ? s.packageType === "medical" : s.packageType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [shipmentList, search, statusFilter, typeFilter]);

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
    toast.success("Shipment monitoring data refreshed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Shipment Monitoring
            </h1>
            <Badge variant="outline" className="text-[10px] gap-1 font-mono">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every shipment in the system, real-time from the database.
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
            Total <Activity className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xl font-semibold font-display mt-1">{counts.total}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            In Transit <Truck className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xl font-semibold font-display mt-1">{counts.inTransit}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Out for Delivery <PackageCheck className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xl font-semibold font-display mt-1">{counts.outForDelivery}</div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Attempted / Returned <AlertTriangle className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xl font-semibold font-display mt-1 text-amber-600 dark:text-amber-400">
            {counts.exceptions}
          </div>
        </div>
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xl font-semibold font-display mt-1">{counts.medical}</div>
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
              onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === t.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by tracking ID or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Route</TableHead>
              <TableHead className="text-xs font-medium">Type & Weight</TableHead>
              <TableHead className="text-xs font-medium">Assignment</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Progress</TableHead>
              <TableHead className="text-xs font-medium">ETA</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                  No shipments found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((s: any) => (
                <TableRow key={s.id} className="text-xs hover:bg-muted/30">
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

                  <TableCell className="text-muted-foreground capitalize">
                    {s.packageType} · {s.weightKg} kg
                  </TableCell>

                  <TableCell>
                    {s.assignedAgentId ? (
                      <span className="text-foreground font-medium">Assigned</span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={toBadgeStatus(s.status)} />
                  </TableCell>

                  <TableCell className="w-32">
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${toProgress(s.status)}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">{toProgress(s.status)}% complete</div>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-foreground">
                    {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString() : "TBD"}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground">{s.trackingId}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
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
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t bg-muted/10 text-xs text-muted-foreground">
          Showing <strong>{filteredShipments.length}</strong> of <strong>{shipmentList.length}</strong> shipments
        </div>
      </div>
    </div>
  );
}
