import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { drivers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  HeartPulse,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/medical")({
  head: () => ({
    meta: [
      { title: "Medical Queue — Hub Operations" },
      { name: "description", content: "Priority cold-chain medical consignment queue, temperature logs, and dedicated rider dispatch." },
    ],
  }),
  component: HubMedicalPage,
});

export interface MedicalParcel {
  id: string;
  tracking: string;
  content: string;
  tempLogged: string;
  targetSla: string;
  rider: string;
  status: "Priority Locked" | "In Transit" | "Delivered";
}

const INITIAL_MEDICAL: MedicalParcel[] = [
  { id: "M-101", tracking: "SLX-77421-IN", content: "Cold-Chain Vaccines (2-8°C)", tempLogged: "3.4 °C Verified", targetSla: "1:30 PM (in 42m)", rider: "Anita Sharma", status: "Priority Locked" },
  { id: "M-102", tracking: "SLX-77432-IN", content: "Emergency Surgical Supplies", tempLogged: "Ambient Verified", targetSla: "2:00 PM (in 1h 12m)", rider: "Anita Sharma", status: "Priority Locked" },
  { id: "M-103", tracking: "SLX-77440-IN", content: "Insulin Consignment", tempLogged: "4.1 °C Verified", targetSla: "2:15 PM (in 1h 27m)", rider: "Unassigned", status: "Priority Locked" },
];

function HubMedicalPage() {
  const [medicalList, setMedicalList] = useState<MedicalParcel[]>(INITIAL_MEDICAL);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState(drivers[1]?.name || "Anita Sharma");

  const handleVerifyTemp = (tracking: string) => {
    toast.success(`Cold-chain temperature re-verified for ${tracking}: 3.2°C (Optimal Range)`);
  };

  const handleAssignRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTracking) return;

    setMedicalList((prev) =>
      prev.map((m) => (m.tracking === selectedTracking ? { ...m, rider: selectedRider } : m))
    );
    setIsAssignOpen(false);
    toast.success(`Assigned dedicated rider ${selectedRider} to medical consignment ${selectedTracking}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Medical Priority Queue
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-red-300 text-red-600 bg-red-50 dark:bg-red-950/40">
              <Lock className="h-3 w-3" /> PRIORITY LOCKED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dedicated handling lane for cold-chain vaccines, emergency surgical kits, and priority medical consignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported medical chain-of-custody log")}
          >
            <Download className="h-3.5 w-3.5" /> Export Custody Log
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Medical Queue <HeartPulse className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{medicalList.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Cold-Chain Temp Log <Thermometer className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">100% OK</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Custody Verified <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">Verified</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Dedicated Lane Rider <UserCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">Anita Sharma</div>
        </div>
      </div>

      {/* Medical Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Parcel Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Consignment Cargo</TableHead>
              <TableHead className="text-xs font-medium">Temperature Log</TableHead>
              <TableHead className="text-xs font-medium">Target Delivery SLA</TableHead>
              <TableHead className="text-xs font-medium">Dedicated Rider</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-36 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicalList.map((m) => (
              <TableRow key={m.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3.5 font-mono font-semibold text-foreground text-xs">
                  {m.tracking}
                </TableCell>

                <TableCell className="font-medium text-foreground text-xs">
                  {m.content}
                </TableCell>

                <TableCell className="text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-foreground" />
                    <span>{m.tempLogged}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.targetSla}
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {m.rider}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800">
                    {m.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleVerifyTemp(m.tracking)}
                  >
                    Verify Temp
                  </Button>
                  {m.rider === "Unassigned" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedTracking(m.tracking);
                        setIsAssignOpen(true);
                      }}
                    >
                      Assign Rider
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign Rider Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Dedicated Medical Rider</DialogTitle>
            <DialogDescription>
              Assign a dedicated rider for medical consignment {selectedTracking}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRiderSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Dedicated Rider</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name} ({d.vehicle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Assign Rider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
