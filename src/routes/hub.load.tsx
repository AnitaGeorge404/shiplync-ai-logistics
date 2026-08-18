import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { hubs as initialHubs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Warehouse,
  ArrowRightLeft,
  Users,
  Box,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/load")({
  head: () => ({
    meta: [
      { title: "Hub Load & Capacity — Hub Operations" },
      { name: "description", content: "Monitor sorting bay load balancing, queue depth, and inter-hub load rerouting." },
    ],
  }),
  component: HubLoadPage,
});

export interface SortingBay {
  id: string;
  name: string;
  load: number;
  queuedItems: number;
  operator: string;
  status: "Optimal" | "High Load" | "Near Capacity";
}

const INITIAL_BAYS: SortingBay[] = [
  { id: "BAY-01", name: "Bay 1 — Medical Priority Lane", load: 38, queuedItems: 12, operator: "Anita Sharma", status: "Optimal" },
  { id: "BAY-02", name: "Bay 2 — Central Outbound", load: 74, queuedItems: 84, operator: "Ravi Kumar", status: "High Load" },
  { id: "BAY-03", name: "Bay 3 — East Corridor (Whitefield)", load: 62, queuedItems: 52, operator: "Priya R.", status: "Optimal" },
  { id: "BAY-04", name: "Bay 4 — South Corridor (Koramangala)", load: 88, queuedItems: 110, operator: "Vikram M.", status: "Near Capacity" },
  { id: "BAY-05", name: "Bay 5 — North Line-Haul", load: 45, queuedItems: 34, operator: "Suresh N.", status: "Optimal" },
];

function HubLoadPage() {
  const [bays, setBays] = useState<SortingBay[]>(INITIAL_BAYS);
  const [neighborHubs, setNeighborHubs] = useState(initialHubs);

  const handleRebalanceBay = (id: string, name: string) => {
    setBays((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, load: Math.max(30, b.load - 25), queuedItems: Math.max(10, b.queuedItems - 30), status: "Optimal" }
          : b
      )
    );
    toast.success(`Rebalanced sorting load for ${name}. Shifted 30 parcels to Bay 5.`);
  };

  const handleRerouteNeighborHub = (code: string) => {
    setNeighborHubs((prev) =>
      prev.map((h) => (h.code === code ? { ...h, load: Math.max(45, h.load - 20) } : h))
    );
    toast.success(`Triggered inter-hub load reroute for ${code}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Hub Load & Capacity Balancing
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Live sorting bay queue depth, operator allocation, and regional hub load balancing.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => {
            setBays(INITIAL_BAYS);
            toast.success("Recalibrated sorting bay load metrics");
          }}
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Recalibrate Queue
        </Button>
      </div>

      {/* Sorting Bays Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">
            Local Facility Sorting Bays (BLR-South)
          </h2>
          <Badge variant="outline" className="text-[11px] font-mono">
            Overall Facility Load: 64%
          </Badge>
        </div>

        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Sorting Bay</TableHead>
                <TableHead className="text-xs font-medium">Live Queue Load</TableHead>
                <TableHead className="text-xs font-medium">Parcels Queued</TableHead>
                <TableHead className="text-xs font-medium">Shift Lead Operator</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="w-28 text-right text-xs font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bays.map((b) => (
                <TableRow key={b.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3.5">
                    <div className="font-medium text-foreground text-xs">{b.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{b.id}</div>
                  </TableCell>

                  <TableCell className="w-48">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>{b.load}%</span>
                        <span className="text-muted-foreground">{b.load > 80 ? "Near Max" : "Normal"}</span>
                      </div>
                      <Progress value={b.load} className="h-1.5" />
                    </div>
                  </TableCell>

                  <TableCell className="font-semibold text-foreground text-xs">
                    {b.queuedItems} items
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {b.operator}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          b.status === "Optimal"
                            ? "bg-emerald-500"
                            : b.status === "High Load"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium text-xs">{b.status}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleRebalanceBay(b.id, b.name)}
                    >
                      <ArrowRightLeft className="h-3 w-3" /> Rebalance
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Regional Inter-Hub Load Section */}
      <div className="space-y-3 pt-4 border-t">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Regional Network Load Balancing
          </h2>
          <p className="text-xs text-muted-foreground">
            Inter-hub rerouting thresholds when neighboring facilities experience volume surges.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {neighborHubs.map((h) => (
            <div key={h.code} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-base text-foreground">{h.code}</div>
                  <div className="text-xs text-muted-foreground">{h.city}</div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    h.load > 85 ? "border-red-300 text-red-600" : "border-border"
                  }`}
                >
                  {h.load}% Load
                </Badge>
              </div>

              <Progress value={h.load} className="h-1.5" />

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-muted-foreground">Capacity: {h.capacity.toLocaleString()}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs p-0 text-foreground"
                  onClick={() => handleRerouteNeighborHub(h.code)}
                >
                  Reroute Volume →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
