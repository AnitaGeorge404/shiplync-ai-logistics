import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { hubs as initialHubs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Warehouse,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Users,
  PackageCheck,
  PackageOpen,
  ArrowRightLeft,
  Settings,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/hubs")({
  head: () => ({
    meta: [
      { title: "Hub Operations — Admin Dashboard" },
      { name: "description", content: "Manage sorting hubs, load capacities, staff assignments, and inbound/outbound flow." },
    ],
  }),
  component: AdminHubsPage,
});

export interface HubItem {
  code: string;
  city: string;
  load: number;
  capacity: number;
  staff: number;
  incoming: number;
  outgoing: number;
  status: "healthy" | "congested" | "warning";
}

function AdminHubsPage() {
  const [hubList, setHubList] = useState<HubItem[]>(initialHubs as HubItem[]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddHubOpen, setIsAddHubOpen] = useState(false);

  // New Hub form state
  const [newCode, setNewCode] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCapacity, setNewCapacity] = useState("4000");
  const [newStaff, setNewStaff] = useState("30");

  const filteredHubs = useMemo(() => {
    return hubList.filter((h) => {
      const matchesSearch =
        h.code.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || h.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hubList, search, statusFilter]);

  const stats = useMemo(() => {
    const totalHubs = hubList.length;
    const avgLoad = Math.round(
      hubList.reduce((acc, h) => acc + h.load, 0) / (totalHubs || 1)
    );
    const totalStaff = hubList.reduce((acc, h) => acc + h.staff, 0);
    const totalParcels = hubList.reduce((acc, h) => acc + h.incoming + h.outgoing, 0);

    return { totalHubs, avgLoad, totalStaff, totalParcels };
  }, [hubList]);

  const handleAddHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newCity) return;

    const newHub: HubItem = {
      code: newCode.toUpperCase(),
      city: newCity,
      load: 35,
      capacity: parseInt(newCapacity) || 4000,
      staff: parseInt(newStaff) || 30,
      incoming: 120,
      outgoing: 180,
      status: "healthy",
    };

    setHubList([...hubList, newHub]);
    setIsAddHubOpen(false);
    setNewCode("");
    setNewCity("");
    toast.success(`Sorting hub ${newHub.code} created`);
  };

  const handleRebalance = (code: string) => {
    setHubList((prev) =>
      prev.map((h) => (h.code === code ? { ...h, load: Math.max(40, h.load - 15), status: "healthy" } : h))
    );
    toast.success(`Load rebalanced for ${code}. Rerouted 15% parcels.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Hub Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor sorting hub capacities, dispatch centers, staff allocation, and parcel intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported hub capacity report")}
          >
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsAddHubOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add New Hub
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Hubs <Warehouse className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.totalHubs}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Avg Load Factor <SlidersHorizontal className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.avgLoad}%</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Staff <Users className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.totalStaff}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Daily Throughput <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">
            {stats.totalParcels.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by hub code or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Hubs</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="congested">Congested</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Hub Code & Location</TableHead>
              <TableHead className="text-xs font-medium">Current Load Capacity</TableHead>
              <TableHead className="text-xs font-medium">Staffing</TableHead>
              <TableHead className="text-xs font-medium">Incoming / Outgoing</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHubs.map((h) => (
              <TableRow key={h.code} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5">
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {h.code}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{h.city}</div>
                </TableCell>

                <TableCell className="w-48">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-muted-foreground">{h.load}%</span>
                      <span className="text-muted-foreground">{h.capacity.toLocaleString()} max</span>
                    </div>
                    <Progress value={h.load} className="h-1.5" />
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {h.staff} operators
                </TableCell>

                <TableCell className="text-xs">
                  <span className="text-foreground font-medium">+{h.incoming}</span> in ·{" "}
                  <span className="text-muted-foreground">-{h.outgoing} out</span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        h.status === "healthy"
                          ? "bg-emerald-500"
                          : h.status === "congested"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="capitalize font-medium text-xs">{h.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        {h.code}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRebalance(h.code)} className="gap-2 text-xs">
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Rebalance Load
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info(`Editing settings for ${h.code}`)} className="gap-2 text-xs">
                        <Settings className="h-3.5 w-3.5" /> Hub Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Hub Modal */}
      <Dialog open={isAddHubOpen} onOpenChange={setIsAddHubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Sorting Hub</DialogTitle>
            <DialogDescription>
              Register a new intake & dispatch facility into the ShipLync network.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddHub} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Hub Code</Label>
              <Input
                placeholder="e.g. PNQ-Main"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">City / Region</Label>
              <Input
                placeholder="e.g. Pune"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Daily Capacity</Label>
                <Input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Assigned Staff</Label>
                <Input
                  type="number"
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddHubOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Create Hub</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
