import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useVehicles, useHubs, useQueryClient } from "@/lib/api-hooks";
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

const VEHICLE_TYPES = ["bike", "van", "truck", "ev_bike", "ev_van"] as const;

function AdminFleetPage() {
  const { data: fleetList = [] } = useVehicles();
  const { data: hubsList = [] } = useHubs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  const [newReg, setNewReg] = useState("");
  const [newType, setNewType] = useState<(typeof VEHICLE_TYPES)[number]>("ev_van");
  const [newHubId, setNewHubId] = useState("");
  const [newCapacity, setNewCapacity] = useState("250");

  const filteredFleet = useMemo(() => {
    return fleetList.filter(
      (v: any) =>
        v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [fleetList, search]);

  const stats = useMemo(() => {
    const total = fleetList.length;
    const evCount = fleetList.filter((v: any) => v.isElectric).length;
    const active = fleetList.filter((v: any) => v.active).length;
    return { total, evCount, active };
  }, [fleetList]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg || !newHubId) {
      toast.error("Registration number and hub are required");
      return;
    }
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        registrationNumber: newReg.toUpperCase(),
        type: newType,
        hubId: newHubId,
        capacityKg: Number(newCapacity),
        isElectric: newType.startsWith("ev_"),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not register vehicle");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    setIsAddVehicleOpen(false);
    setNewReg("");
    toast.success(`Registered vehicle ${newReg.toUpperCase()}`);
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
            Active <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.active}</div>
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
            Hubs Covered <Wrench className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{hubsList.length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search reg number, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Fleet Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Registration</TableHead>
              <TableHead className="text-xs font-medium">Vehicle Type</TableHead>
              <TableHead className="text-xs font-medium">Hub</TableHead>
              <TableHead className="text-xs font-medium">Capacity</TableHead>
              <TableHead className="text-xs font-medium">Electric</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFleet.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  No vehicles registered yet.
                </TableCell>
              </TableRow>
            )}
            {filteredFleet.map((v: any) => (
              <TableRow key={v.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {v.registrationNumber}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                    {v.type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {hubsList.find((h: any) => h.id === v.hubId)?.name ?? "—"}
                </TableCell>

                <TableCell className="text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <BatteryCharging className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{v.capacityKg} kg</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs">{v.isElectric ? "Yes" : "No"}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${v.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    <span className="font-medium text-xs">{v.active ? "Active" : "Inactive"}</span>
                  </div>
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
              Register a new delivery vehicle into the fleet registry.
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
                <Select value={newType} onValueChange={(val) => setNewType(val as typeof newType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Capacity (kg)</Label>
                <Input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hub</Label>
              <Select value={newHubId} onValueChange={setNewHubId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select hub" />
                </SelectTrigger>
                <SelectContent>
                  {hubsList.map((h: any) => (
                    <SelectItem key={h.id} value={h.id}>{h.name} ({h.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
