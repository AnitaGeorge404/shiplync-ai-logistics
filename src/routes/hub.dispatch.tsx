import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { drivers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  Plus,
  Search,
  MoreHorizontal,
  Sparkles,
  Printer,
  UserCheck,
  CheckCircle2,
  Package,
  ArrowRightLeft,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch Center — Hub Operations" },
      { name: "description", content: "Manage outbound parcel queues, route clustering, driver assignments, and dispatch manifests." },
    ],
  }),
  component: HubDispatchPage,
});

export interface DispatchBatch {
  id: string;
  destination: string;
  driver: string;
  vehicle: string;
  packagesCount: number;
  totalWeight: string;
  status: "Ready" | "Loading" | "Assigning" | "Dispatched";
}

const INITIAL_BATCHES: DispatchBatch[] = [
  { id: "SLX-77500", destination: "Koramangala Zone", driver: "Ravi Kumar", vehicle: "EV Bike", packagesCount: 14, totalWeight: "18.4 kg", status: "Ready" },
  { id: "SLX-77501", destination: "Whitefield Tech Park", driver: "Unassigned", vehicle: "Unassigned", packagesCount: 22, totalWeight: "42.0 kg", status: "Assigning" },
  { id: "SLX-77502", destination: "HSR Layout Sector 1-4", driver: "Priya R.", vehicle: "EV Cargo Van", packagesCount: 18, totalWeight: "31.5 kg", status: "Loading" },
  { id: "SLX-77503", destination: "Indiranagar 100ft Rd", driver: "Suresh N.", vehicle: "EV Bike", packagesCount: 12, totalWeight: "14.2 kg", status: "Ready" },
];

function HubDispatchPage() {
  const [batches, setBatches] = useState<DispatchBatch[]>(INITIAL_BATCHES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState(drivers[0]?.name || "");

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.destination.toLowerCase().includes(search.toLowerCase()) ||
        b.driver.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [batches, search, statusFilter]);

  const stats = useMemo(() => {
    const total = batches.length;
    const ready = batches.filter((b) => b.status === "Ready").length;
    const loading = batches.filter((b) => b.status === "Loading").length;
    const totalParcels = batches.reduce((acc, b) => acc + b.packagesCount, 0);

    return { total, ready, loading, totalParcels };
  }, [batches]);

  const handleDispatchBatch = (id: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Dispatched" } : b))
    );
    toast.success(`Batch ${id} dispatched successfully! Manifest generated.`);
  };

  const handleAssignDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !selectedDriver) return;

    const driverObj = drivers.find((d) => d.name === selectedDriver);
    const vehicleStr = driverObj ? driverObj.vehicle : "EV Bike";

    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatchId
          ? { ...b, driver: selectedDriver, vehicle: vehicleStr, status: "Ready" }
          : b
      )
    );

    setIsAssignOpen(false);
    toast.success(`Assigned ${selectedDriver} (${vehicleStr}) to ${selectedBatchId}`);
  };

  const handleAIClusterAll = () => {
    toast.info("AI Cluster Engine optimizing 4 outbound routes...");
    setTimeout(() => {
      setBatches((prev) =>
        prev.map((b) =>
          b.status === "Assigning"
            ? { ...b, driver: "Ravi Kumar", vehicle: "EV Van", status: "Ready" }
            : b
        )
      );
      toast.success("AI clustered 42 packages into 4 optimal driver routes!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Dispatch Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Outbound route clustering, driver manifest assignment, and batch dispatch management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleAIClusterAll}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI Cluster & Assign All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported dispatch manifests")}
          >
            <Download className="h-3.5 w-3.5" /> Export Manifests
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Dispatch Batches <Truck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Ready to Roll <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.ready}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Currently Loading <Package className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.loading}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Outbound Packages <Package className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.totalParcels}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search batch ID, zone, driver..."
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
            <SelectItem value="ALL">All Batches</SelectItem>
            <SelectItem value="Ready">Ready</SelectItem>
            <SelectItem value="Loading">Loading</SelectItem>
            <SelectItem value="Assigning">Assigning</SelectItem>
            <SelectItem value="Dispatched">Dispatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dispatch Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Batch ID</TableHead>
              <TableHead className="text-xs font-medium">Destination Zone</TableHead>
              <TableHead className="text-xs font-medium">Assigned Driver & Vehicle</TableHead>
              <TableHead className="text-xs font-medium">Parcels & Weight</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-28 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.map((b) => (
              <TableRow key={b.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5 font-mono font-semibold text-foreground text-xs">
                  {b.id}
                </TableCell>

                <TableCell className="font-medium text-foreground text-xs">
                  {b.destination}
                </TableCell>

                <TableCell>
                  {b.driver !== "Unassigned" ? (
                    <div>
                      <div className="font-medium text-foreground">{b.driver}</div>
                      <div className="text-[11px] text-muted-foreground">{b.vehicle}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Assigning rider...</span>
                  )}
                </TableCell>

                <TableCell className="text-xs">
                  <span className="font-medium text-foreground">{b.packagesCount} items</span> ·{" "}
                  <span className="text-muted-foreground">{b.totalWeight}</span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        b.status === "Ready"
                          ? "bg-emerald-500"
                          : b.status === "Loading"
                          ? "bg-amber-500"
                          : b.status === "Dispatched"
                          ? "bg-blue-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className="font-medium text-xs">{b.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {b.status === "Assigning" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedBatchId(b.id);
                        setIsAssignOpen(true);
                      }}
                    >
                      Assign Rider
                    </Button>
                  ) : b.status !== "Dispatched" ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDispatchBatch(b.id)}
                    >
                      Dispatch
                    </Button>
                  ) : (
                    <Badge variant="outline" className="font-normal text-[11px]">
                      Dispatched
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign Driver Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Rider</DialogTitle>
            <DialogDescription>
              Assign an on-duty rider to outbound dispatch batch {selectedBatchId}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignDriverSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Select Delivery Partner</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name} ({d.vehicle} · {d.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Assign & Confirm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
