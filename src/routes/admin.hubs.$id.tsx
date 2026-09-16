import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useHubs, useShipments, useVehicles, useUsers, useExceptions, toBadgeStatus } from "@/lib/api-hooks";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ArrowLeft, ChevronRight, Warehouse } from "lucide-react";

export const Route = createFileRoute("/admin/hubs/$id")({
  head: () => ({ meta: [{ title: "Hub Detail — Admin Command Center" }] }),
  component: HubDetailPage,
});

function HubDetailPage() {
  const { id } = useParams({ from: "/admin/hubs/$id" });
  const { data: hubs = [] } = useHubs();
  const { data: shipments = [] } = useShipments("all");
  const { data: vehicles = [] } = useVehicles();
  const { data: users = [] } = useUsers();
  const { data: exceptions = [] } = useExceptions();

  const hub = hubs.find((h: any) => h.id === id);

  const shipmentsAtHub = useMemo(() => shipments.filter((s: any) => s.currentHubId === id), [shipments, id]);
  const vehiclesAtHub = useMemo(() => vehicles.filter((v: any) => v.hubId === id), [vehicles, id]);
  const staffAtHub = useMemo(() => users.filter((u: any) => u.hubId === id && u.role === "hub_staff"), [users, id]);
  const exceptionsAtHub = useMemo(() => {
    const shipmentIds = new Set(shipmentsAtHub.map((s: any) => s.id));
    return exceptions.filter((e: any) => e.shipmentId && shipmentIds.has(e.shipmentId));
  }, [exceptions, shipmentsAtHub]);

  if (!hub) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="text-sm text-muted-foreground">Hub not found.</div>
        <Button variant="outline" size="sm" asChild><Link to="/admin/hubs">Back to hubs</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/admin/hubs" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Hubs</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-foreground">{hub.code}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{hub.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{hub.addressLine}, {hub.city}, {hub.state} {hub.pincode}</p>
          </div>
        </div>
        <div className="text-right min-w-[160px]">
          <div className="text-xs text-muted-foreground">Load</div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={hub.loadPct} className="h-1.5 w-24" />
            <span className="text-sm font-semibold">{hub.loadPct}%</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{hub.activeShipmentCount} / {hub.capacity.toLocaleString()} capacity</div>
        </div>
      </div>

      <Tabs defaultValue="shipments">
        <TabsList>
          <TabsTrigger value="shipments" className="text-xs">Shipments ({shipmentsAtHub.length})</TabsTrigger>
          <TabsTrigger value="vehicles" className="text-xs">Vehicles ({vehiclesAtHub.length})</TabsTrigger>
          <TabsTrigger value="staff" className="text-xs">Staff ({staffAtHub.length})</TabsTrigger>
          <TabsTrigger value="exceptions" className="text-xs">Exceptions ({exceptionsAtHub.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="mt-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                  <TableHead className="text-xs font-medium">Route</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipmentsAtHub.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">No shipments currently at this hub.</TableCell></TableRow>
                )}
                {shipmentsAtHub.map((s: any) => (
                  <TableRow key={s.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5">
                      <Link to="/admin/shipments/$trackingId" params={{ trackingId: s.trackingId }} className="font-mono text-primary hover:underline">
                        {s.trackingId}
                      </Link>
                    </TableCell>
                    <TableCell>{s.senderCity} → {s.receiverCity}</TableCell>
                    <TableCell><StatusBadge status={toBadgeStatus(s.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium">Registration</TableHead>
                  <TableHead className="text-xs font-medium">Type</TableHead>
                  <TableHead className="text-xs font-medium">Capacity</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesAtHub.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No vehicles assigned to this hub.</TableCell></TableRow>
                )}
                {vehiclesAtHub.map((v: any) => (
                  <TableRow key={v.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5 font-mono">{v.registrationNumber}</TableCell>
                    <TableCell className="capitalize">{v.type.replace(/_/g, " ")}</TableCell>
                    <TableCell>{v.capacityKg} kg</TableCell>
                    <TableCell>
                      <span className={`h-2 w-2 rounded-full inline-block mr-1.5 ${v.active ? "bg-success" : "bg-muted-foreground"}`} />
                      {v.active ? "Active" : "Inactive"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium">Email</TableHead>
                  <TableHead className="text-xs font-medium">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffAtHub.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">No staff assigned to this hub.</TableCell></TableRow>
                )}
                {staffAtHub.map((u: any) => (
                  <TableRow key={u.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5 font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phone ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="exceptions" className="mt-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium">Type</TableHead>
                  <TableHead className="text-xs font-medium">Message</TableHead>
                  <TableHead className="text-xs font-medium">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptionsAtHub.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">No open exceptions at this hub.</TableCell></TableRow>
                )}
                {exceptionsAtHub.map((e: any) => (
                  <TableRow key={e.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5 font-medium capitalize">{e.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{e.message}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize font-normal ${e.severity === "critical" ? "border-destructive/30 text-destructive" : e.severity === "warning" ? "border-warning/30 text-warning-foreground" : ""}`}>
                        {e.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
