import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { shipments, type Shipment } from "@/lib/mock-data";
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
  SlidersHorizontal,
  MoreHorizontal,
  Truck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  UserCheck,
  Download,
  PackageCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/map")({
  head: () => ({
    meta: [
      { title: "Shipment Monitoring — Admin Command Center" },
      { name: "description", content: "Real-time monitoring table of active shipments, driver routes, and status updates." },
    ],
  }),
  component: ShipmentMonitoringPage,
});

function ShipmentMonitoringPage() {
  const navigate = useNavigate();
  const [shipmentList, setShipmentList] = useState<Shipment[]>(shipments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipmentList.filter((s) => {
      const matchesSearch =
        s.tracking.toLowerCase().includes(search.toLowerCase()) ||
        s.fromCity.toLowerCase().includes(search.toLowerCase()) ||
        s.toCity.toLowerCase().includes(search.toLowerCase()) ||
        (s.driver && s.driver.toLowerCase().includes(search.toLowerCase())) ||
        s.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesType =
        typeFilter === "ALL"
          ? true
          : typeFilter === "MEDICAL"
          ? s.medical
          : s.packageType.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [shipmentList, search, statusFilter, typeFilter]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: shipmentList.length,
      inTransit: shipmentList.filter((s) => s.status === "in_transit").length,
      outForDelivery: shipmentList.filter((s) => s.status === "out_for_delivery").length,
      exceptions: shipmentList.filter((s) => s.status === "exception").length,
      medical: shipmentList.filter((s) => s.medical).length,
    };
  }, [shipmentList]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Shipment monitoring data updated");
    }, 600);
  };

  const handleReassign = (id: string, tracking: string) => {
    toast.info(`Reassigning rider for parcel ${tracking}...`);
  };

  const handleFlagException = (id: string, tracking: string) => {
    setShipmentList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "exception" } : s))
    );
    toast.warning(`Flagged ${tracking} as Exception`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Shipment Monitoring
            </h1>
            <Badge variant="outline" className="text-[10px] gap-1 font-mono">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> LIVE STREAM
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time status tracking, driver route progress, hub checkpoints, and exception logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Feed
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported monitoring report")}
          >
            <Download className="h-3.5 w-3.5" /> Export Data
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border rounded-lg p-3.5 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Monitored <Activity className="h-3.5 w-3.5 text-foreground" />
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
            Delayed / Exceptions <AlertTriangle className="h-3.5 w-3.5 text-foreground" />
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

      {/* Filter Tabs & Toolbar */}
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: "All Active" },
            { id: "in_transit", label: "In Transit" },
            { id: "out_for_delivery", label: "Out for Delivery" },
            { id: "at_hub", label: "At Hub" },
            { id: "exception", label: "Exceptions" },
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

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Package Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="MEDICAL">Medical Only</SelectItem>
              <SelectItem value="Express">Express</SelectItem>
              <SelectItem value="Fragile">Fragile</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by Tracking ID, city, driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      {/* Main Monitoring Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Route (From → To)</TableHead>
              <TableHead className="text-xs font-medium">Type & Weight</TableHead>
              <TableHead className="text-xs font-medium">Assigned Driver</TableHead>
              <TableHead className="text-xs font-medium">Current Status</TableHead>
              <TableHead className="text-xs font-medium">Progress</TableHead>
              <TableHead className="text-xs font-medium">ETA</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                  No shipments found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((s) => (
                <TableRow key={s.id} className="text-xs hover:bg-muted/30">
                  {/* Tracking ID */}
                  <TableCell className="py-3">
                    <div className="font-mono font-medium text-foreground text-xs">
                      {s.tracking}
                    </div>
                    {s.medical && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground/30 mt-0.5">
                        Medical
                      </Badge>
                    )}
                  </TableCell>

                  {/* Route */}
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {s.fromCity} → {s.toCity}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {s.from}
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="text-muted-foreground">
                    {s.packageType} · {s.weight} kg
                  </TableCell>

                  {/* Driver */}
                  <TableCell>
                    {s.driver ? (
                      <div>
                        <div className="font-medium text-foreground">{s.driver}</div>
                        <div className="text-[10px] text-muted-foreground">{s.vehicle}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Assigning rider...</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>

                  {/* Progress bar */}
                  <TableCell className="w-32">
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.progress}% complete
                      </div>
                    </div>
                  </TableCell>

                  {/* ETA */}
                  <TableCell className="font-medium text-foreground">
                    {s.eta}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                          {s.tracking}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({
                              to: "/customer/track/$id",
                              params: { id: s.id },
                            })
                          }
                          className="gap-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" /> Live Tracker View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReassign(s.id, s.tracking)}
                          className="gap-2 text-xs"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Reassign Driver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFlagException(s.id, s.tracking)}
                          className="gap-2 text-xs text-amber-600"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Flag Exception
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination */}
        <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <strong>{filteredShipments.length}</strong> of{" "}
            <strong>{shipmentList.length}</strong> monitored shipments
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" disabled>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" disabled>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
