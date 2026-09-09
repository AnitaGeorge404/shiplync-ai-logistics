import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useHubs, useQueryClient } from "@/lib/api-hooks";
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

function AdminHubsPage() {
  const { data: hubList = [] } = useHubs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddHubOpen, setIsAddHubOpen] = useState(false);

  // New Hub form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCapacity, setNewCapacity] = useState("4000");

  const filteredHubs = useMemo(() => {
    return hubList.filter(
      (h: any) =>
        h.code.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()),
    );
  }, [hubList, search]);

  const stats = useMemo(() => {
    const totalHubs = hubList.length;
    const totalCapacity = hubList.reduce((acc: number, h: any) => acc + h.capacity, 0);
    return { totalHubs, totalCapacity };
  }, [hubList]);

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
            Total Capacity <SlidersHorizontal className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.totalCapacity.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Network <Users className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">Live</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Source <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">Database</div>
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
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Hub Code & Location</TableHead>
              <TableHead className="text-xs font-medium">Address</TableHead>
              <TableHead className="text-xs font-medium">Capacity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHubs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">
                  No hubs registered yet.
                </TableCell>
              </TableRow>
            )}
            {filteredHubs.map((h: any) => (
              <TableRow key={h.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5">
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {h.code}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{h.name} · {h.city}</div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {h.addressLine}, {h.state} {h.pincode}
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {h.capacity.toLocaleString()} / day
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
