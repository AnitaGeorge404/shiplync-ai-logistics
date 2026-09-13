import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ScanLine,
  PackageCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck,
  Box,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/intake")({
  head: () => ({
    meta: [
      { title: "Intake & Scan — Hub Operations" },
      { name: "description", content: "Scan incoming parcels and mark them received at this hub — writes to the live database." },
    ],
  }),
  component: HubIntakePage,
});

function HubIntakePage() {
  const { data: hubShipments = [], isLoading } = useShipments("hub");
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = hubShipments.length;
    const medical = hubShipments.filter((s: any) => s.packageType === "medical").length;
    const arrived = hubShipments.filter((s: any) => s.status === "arrived_hub").length;
    return { total, medical, arrived };
  }, [hubShipments]);

  const filteredHistory = useMemo(() => {
    return hubShipments.filter(
      (s: any) =>
        s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        s.senderCity.toLowerCase().includes(search.toLowerCase()) ||
        s.receiverCity.toLowerCase().includes(search.toLowerCase()),
    );
  }, [hubShipments, search]);

  const activeParcel = hubShipments.find((s: any) => s.trackingId === activeTrackingId);

  async function scanIntake(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const lookup = await fetch(`/api/shipments/track/${encodeURIComponent(code.trim())}`);
      const lookupData = await lookup.json();
      if (!lookup.ok) {
        setError(lookupData.error || "Tracking ID not found in database.");
        return;
      }
      const shipmentId = lookupData.shipment.id;
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "arrived_hub",
          // location is intentionally omitted — the server fills in the
          // real hub name for the scanning hub_staff user's own hub.
          note: "Scanned at hub intake.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update shipment.");
        return;
      }
      setActiveTrackingId(data.shipment.trackingId);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
      toast.success(`${data.shipment.trackingId} scanned — marked arrived at hub`);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Intake & Scan
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Scan a real tracking ID to mark it received at this hub — writes directly to the database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            At This Hub <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Arrived, Awaiting Dispatch <Box className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.arrived}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.medical}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 border rounded-xl p-5 bg-card space-y-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scan tracking ID
          </div>
          <form onSubmit={scanIntake} className="flex gap-2">
            <Input
              placeholder="e.g. SLXA158N21TS5"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 text-xs font-mono bg-background"
              autoFocus
            />
            <Button type="submit" className="h-10 text-xs gap-1.5 px-4" disabled={busy}>
              <ScanLine className="h-4 w-4" /> {busy ? "Scanning..." : "Scan"}
            </Button>
          </form>
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>

        <div className="lg:col-span-7 border rounded-xl p-5 bg-card space-y-4 shadow-sm">
          {activeParcel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Last scanned</div>
                  <div className="font-mono text-xl font-bold text-foreground mt-0.5 flex items-center gap-2">
                    {activeParcel.trackingId}
                    {activeParcel.packageType === "medical" && (
                      <Badge variant="outline" className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800">
                        Medical Priority
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800 capitalize">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {activeParcel.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Origin</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.senderCity}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Destination</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.receiverCity}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Category</div>
                  <div className="font-medium text-foreground mt-0.5 capitalize">{activeParcel.packageType}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Weight</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.weightKg} kg</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-foreground" />
                <span>Next step: assign a delivery agent and dispatch from Hub → Dispatch Center.</span>
              </div>
            </div>
          ) : (
            <div className="h-full grid place-items-center text-center text-muted-foreground text-xs py-16">
              <div>
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Scan a tracking ID to see its details here.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Shipments at this hub</h2>
            <p className="text-xs text-muted-foreground">Real data from the database.</p>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by tracking ID or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                <TableHead className="text-xs font-medium">Origin → Destination</TableHead>
                <TableHead className="text-xs font-medium">Type & Weight</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && filteredHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                    No shipments at this hub yet.
                  </TableCell>
                </TableRow>
              )}
              {filteredHistory.map((p: any) => (
                <TableRow
                  key={p.id}
                  className={`text-xs hover:bg-muted/30 cursor-pointer ${activeParcel?.id === p.id ? "bg-muted/50" : ""}`}
                  onClick={() => setActiveTrackingId(p.trackingId)}
                >
                  <TableCell className="font-mono font-semibold text-foreground text-xs py-3">
                    {p.trackingId}
                    {p.packageType === "medical" && (
                      <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1 border-red-200 text-red-600">Med</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{p.senderCity} → {p.receiverCity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{p.packageType} · {p.weightKg} kg</TableCell>
                  <TableCell className="text-xs font-medium capitalize">{p.status.replace(/_/g, " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
