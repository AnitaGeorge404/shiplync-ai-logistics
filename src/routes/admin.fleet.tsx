import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { drivers as initialDrivers } from "@/lib/mock-data";
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
  Filter,
  MoreHorizontal,
  Zap,
  BatteryCharging,
  Wrench,
  Download,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fleet")({
  head: () => ({
    meta: [
      { title: "Vehicles & Fleet — Admin Dashboard" },
      { name: "description", content: "Manage vehicle fleet, EV chargers, telemetry, driver assignments, and maintenance logs." },
    ],
  }),
  component: AdminFleetPage,
});

export interface VehicleItem {
  id: string;
  regNumber: string;
  type: "EV Cargo" | "EV Van" | "Medical Bike" | "Mini Van" | "Bike" | "Line-Haul Truck";
  driver: string;
  city: string;
  battery: number;
  status: "On Duty" | "Charging" | "Maintenance" | "Idle";
}

const INITIAL_FLEET: VehicleItem[] = [
  { id: "VEH-101", regNumber: "KA-05-EV-2210", type: "EV Cargo", driver: "Ravi Kumar", city: "Bengaluru", battery: 88, status: "On Duty" },
  { id: "VEH-102", regNumber: "DL-8C-AB-7788", type: "Medical Bike", driver: "Anita Sharma", city: "Delhi", battery: 94, status: "On Duty" },
  { id: "VEH-103", regNumber: "TN-09-CD-1120", type: "Mini Van", driver: "Suresh N.", city: "Chennai", battery: 64, status: "On Duty" },
  { id: "VEH-104", regNumber: "MH-12-AZ-9901", type: "Bike", driver: "Manish D.", city: "Pune", battery: 42, status: "Idle" },
  { id: "VEH-105", regNumber: "MH-02-EV-4412", type: "EV Van", driver: "Priya R.", city: "Mumbai", battery: 78, status: "On Duty" },
  { id: "VEH-106", regNumber: "KA-01-EV-8820", type: "EV Cargo", driver: "Unassigned", city: "Bengaluru", battery: 100, status: "Charging" },
  { id: "VEH-107", regNumber: "DL-04-TR-5510", type: "Line-Haul Truck", driver: "Vikram S.", city: "Delhi", battery: 55, status: "Maintenance" },
];

function AdminFleetPage() {
  const [fleetList, setFleetList] = useState<VehicleItem[]>(INITIAL_FLEET);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  const [newReg, setNewReg] = useState("");
  const [newType, setNewType] = useState<VehicleItem["type"]>("EV Van");
  const [newCity, setNewCity] = useState("Bengaluru");

  const filteredFleet = useMemo(() => {
    return fleetList.filter((v) => {
      const matchesSearch =
        v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.driver.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase()) ||
        v.type.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fleetList, search, statusFilter]);

  const stats = useMemo(() => {
    const total = fleetList.length;
    const onDuty = fleetList.filter((v) => v.status === "On Duty").length;
    const evCount = fleetList.filter((v) => v.type.startsWith("EV")).length;
    const maintenance = fleetList.filter((v) => v.status === "Maintenance").length;

    return { total, onDuty, evCount, maintenance };
  }, [fleetList]);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg) return;

    const newVehicle: VehicleItem = {
      id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
      regNumber: newReg.toUpperCase(),
      type: newType,
      driver: "Unassigned",
      city: newCity,
      battery: 100,
      status: "Idle",
    };

    setFleetList([newVehicle, ...fleetList]);
    setIsAddVehicleOpen(false);
    setNewReg("");
    toast.success(`Registered vehicle ${newVehicle.regNumber}`);
  };

  const handleStatusChange = (id: string, newStatus: VehicleItem["status"]) => {
    setFleetList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
    toast.success(`Vehicle status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Vehicle Fleet
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor active vehicles, EV charging levels, telemetry, and driver assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported fleet telemetry CSV")}
          >
            <Download className="h-3.5 w-3.5" /> Export Telemetry
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsAddVehicleOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Fleet <Truck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On Duty <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.onDuty}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            EV Fleet <Zap className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">
            {stats.evCount} ({Math.round((stats.evCount / (stats.total || 1)) * 100)}%)
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Maintenance <Wrench className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.maintenance}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search reg number, driver, city..."
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
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="On Duty">On Duty</SelectItem>
            <SelectItem value="Charging">Charging</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Idle">Idle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fleet Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Registration & ID</TableHead>
              <TableHead className="text-xs font-medium">Vehicle Type</TableHead>
              <TableHead className="text-xs font-medium">Assigned Driver</TableHead>
              <TableHead className="text-xs font-medium">City</TableHead>
              <TableHead className="text-xs font-medium">Battery / Charge</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFleet.map((v) => (
              <TableRow key={v.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {v.regNumber}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{v.id}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                    {v.type}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {v.driver}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {v.city}
                </TableCell>

                <TableCell className="text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <BatteryCharging className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{v.battery}%</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        v.status === "On Duty"
                          ? "bg-emerald-500"
                          : v.status === "Charging"
                          ? "bg-amber-500"
                          : v.status === "Maintenance"
                          ? "bg-red-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className="font-medium text-xs">{v.status}</span>
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
                        {v.regNumber}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(v.id, "On Duty")} className="gap-2 text-xs">
                        <UserCheck className="h-3.5 w-3.5" /> Set On Duty
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(v.id, "Maintenance")} className="gap-2 text-xs">
                        <Wrench className="h-3.5 w-3.5" /> Flag Maintenance
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Vehicle Modal */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fleet Vehicle</DialogTitle>
            <DialogDescription>
              Register a new delivery vehicle or EV bike into the fleet registry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVehicle} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Registration Number</Label>
              <Input
                placeholder="e.g. KA-05-EV-9920"
                value={newReg}
                onChange={(e) => setNewReg(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={(val) => setNewType(val as VehicleItem["type"])}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EV Cargo">EV Cargo</SelectItem>
                    <SelectItem value="EV Van">EV Van</SelectItem>
                    <SelectItem value="Medical Bike">Medical Bike</SelectItem>
                    <SelectItem value="Mini Van">Mini Van</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Line-Haul Truck">Line-Haul Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operating City</Label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddVehicleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Register Vehicle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
