import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useHubs, useShipments, useVehicles, useExceptions, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Warehouse, Plus, Search, SlidersHorizontal, Truck, ShieldAlert, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/hubs/")({
  head: () => ({
    meta: [
      { title: "Hub Network — Admin Command Center" },
      { name: "description", content: "Real per-hub load, inbound/outbound flow, fleet and exceptions, from the live database." },
    ],
  }),
  component: AdminHubsPage,
});

function AdminHubsPage() {
  const { data: hubList = [] } = useHubs();
  const { data: shipments = [] } = useShipments("all");
  const { data: vehicles = [] } = useVehicles();
  const { data: exceptions = [] } = useExceptions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddHubOpen, setIsAddHubOpen] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCapacity, setNewCapacity] = useState("4000");

  const shipmentById = useMemo(() => new Map(shipments.map((s: any) => [s.id, s])), [shipments]);

  const hubRows = useMemo(() => {
    return hubList.map((h: any) => {
      const incoming = shipments.filter(
        (s: any) => s.destinationHubId === h.id && s.currentHubId !== h.id && !["delivered", "returned", "cancelled"].includes(s.status),
      ).length;
      const outgoing = shipments.filter((s: any) => s.currentHubId === h.id && s.status === "in_transit").length;
      const vehicleCount = vehicles.filter((v: any) => v.hubId === h.id).length;
      const openExceptions = exceptions.filter((e: any) => {
        const s = e.shipmentId ? shipmentById.get(e.shipmentId) : null;
        return s && s.currentHubId === h.id;
      }).length;
      return { ...h, incoming, outgoing, vehicleCount, openExceptions };
    });
  }, [hubList, shipments, vehicles, exceptions, shipmentById]);

  const filteredHubs = useMemo(() => {
    return hubRows.filter(
      (h: any) =>
        h.code.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()),
    );
  }, [hubRows, search]);

  const stats = useMemo(() => {
    const totalHubs = hubList.length;
    const totalCapacity = hubList.reduce((acc: number, h: any) => acc + h.capacity, 0);
    const totalExceptions = hubRows.reduce((acc, h) => acc + h.openExceptions, 0);
    return { totalHubs, totalCapacity, totalExceptions };
  }, [hubList, hubRows]);

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newCity || !newName || !newState || !newPincode || !newAddress) {
      toast.error("All fields are required");
      return;
    }
    const res = await fetch("/api/hubs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: newName,
        code: newCode.toUpperCase(),
        addressLine: newAddress,
        city: newCity,
        state: newState,
        pincode: newPincode,
        lat: 0,
        lng: 0,
        capacity: parseInt(newCapacity) || 4000,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not create hub");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["hubs"] });
    setIsAddHubOpen(false);
    setNewCode("");
    setNewCity("");
    toast.success(`Sorting hub ${newCode.toUpperCase()} created`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hub Network</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real load, inbound/outbound flow, fleet and exceptions per hub — from the live database.
          </p>
        </div>
        <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => setIsAddHubOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add hub
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Hubs <Warehouse className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.totalHubs}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Capacity <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.totalCapacity.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Fleet <Truck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{vehicles.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Open Exceptions <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.totalExceptions}</div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by hub code or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Hub</TableHead>
              <TableHead className="text-xs font-medium text-right">Current load</TableHead>
              <TableHead className="text-xs font-medium text-right">Incoming</TableHead>
              <TableHead className="text-xs font-medium text-right">Outgoing</TableHead>
              <TableHead className="text-xs font-medium text-right">Vehicles</TableHead>
              <TableHead className="text-xs font-medium text-right">Exceptions</TableHead>
              <TableHead className="text-xs font-medium w-48">Capacity</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHubs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-10">
                  No hubs registered yet.
                </TableCell>
              </TableRow>
            )}
            {filteredHubs.map((h: any) => (
              <TableRow key={h.id} className="text-xs hover:bg-muted/20">
                <TableCell className="py-3">
                  <Link to="/admin/hubs/$id" params={{ id: h.id }} className="font-mono font-semibold text-foreground hover:underline">
                    {h.code}
                  </Link>
                  <div className="text-muted-foreground mt-0.5">{h.name} · {h.city}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{h.activeShipmentCount}</TableCell>
                <TableCell className="text-right font-mono">{h.incoming}</TableCell>
                <TableCell className="text-right font-mono">{h.outgoing}</TableCell>
                <TableCell className="text-right font-mono">{h.vehicleCount}</TableCell>
                <TableCell className="text-right font-mono">
                  <span className={h.openExceptions > 0 ? "text-warning-foreground" : ""}>{h.openExceptions}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={h.loadPct} className="h-1.5 flex-1" />
                    <span className={`font-mono w-9 text-right ${h.loadPct > 85 ? "text-destructive" : h.loadPct > 75 ? "text-warning-foreground" : "text-muted-foreground"}`}>{h.loadPct}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link to="/admin/hubs/$id" params={{ id: h.id }}>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddHubOpen} onOpenChange={setIsAddHubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Sorting Hub</DialogTitle>
            <DialogDescription>
              Register a new intake &amp; dispatch facility into the ShipLync network.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddHub} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Hub Code</Label>
                <Input placeholder="e.g. PNQ-MAIN" value={newCode} onChange={(e) => setNewCode(e.target.value)} required className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hub Name</Label>
                <Input placeholder="e.g. Pune Main Hub" value={newName} onChange={(e) => setNewName(e.target.value)} required className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Address</Label>
              <Input placeholder="Street address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required className="h-9 text-xs" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input placeholder="Pune" value={newCity} onChange={(e) => setNewCity(e.target.value)} required className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">State</Label>
                <Input placeholder="MH" value={newState} onChange={(e) => setNewState(e.target.value)} required className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pincode</Label>
                <Input placeholder="411001" value={newPincode} onChange={(e) => setNewPincode(e.target.value)} required className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Daily Capacity</Label>
              <Input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="h-9 text-xs"
              />
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
