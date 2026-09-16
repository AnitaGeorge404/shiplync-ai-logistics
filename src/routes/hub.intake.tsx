import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { useShipments, useQueryClient } from "@/lib/api-hooks";
import { PriorityBadge } from "@/components/shiplync/PriorityBadge";
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
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/shiplync/BarcodeScanner";

export const Route = createFileRoute("/hub/intake")({
  head: () => ({
    meta: [
      { title: "Intake & Scan — Hub Operations" },
      { name: "description", content: "Scan incoming parcels, verify details, and mark them received at this hub — writes to the live database." },
    ],
  }),
  component: HubIntakePage,
});

function HubIntakePage() {
  const { data: hubShipments = [], isLoading } = useShipments("hub");
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The shipment found but not yet marked received — nothing is written to
  // the database until "Mark Received" is confirmed.
  const [pending, setPending] = useState<any | null>(null);
  const [lastReceived, setLastReceived] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const arrived = hubShipments.filter((s: any) => s.status === "arrived_hub").length;
    const awaitingIntake = hubShipments.filter((s: any) => s.status === "booked" || s.status === "picked_up").length;
    const medical = hubShipments.filter((s: any) => s.packageType === "medical" && s.status === "arrived_hub").length;
    return { total: arrived, arrived, awaitingIntake, medical };
  }, [hubShipments]);

  const awaitingIntakeList = useMemo(() => {
    return hubShipments.filter((s: any) => s.status === "booked" || s.status === "picked_up");
  }, [hubShipments]);

  const scannedHistory = useMemo(() => {
    return hubShipments
      .filter((s: any) =>
        ["arrived_hub", "in_transit", "out_for_delivery", "delivery_attempted"].includes(s.status),
      )
      .filter(
        (s: any) =>
          s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
          s.senderCity.toLowerCase().includes(search.toLowerCase()) ||
          s.receiverCity.toLowerCase().includes(search.toLowerCase()),
      );
  }, [hubShipments, search]);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    const rawCode = code.trim();
    if (!rawCode) return;
    setLookingUp(true);
    setError(null);
    setLastReceived(null);
    try {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(rawCode)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tracking ID not found in database.");
        setPending(null);
        return;
      }
      setPending(data.shipment);
    } catch {
      setError("Network error.");
    } finally {
      setLookingUp(false);
    }
  }

  async function confirmReceived() {
    if (!pending) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${pending.id}/status`, {
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
        setError(data.error || "Could not mark this shipment received.");
        return;
      }
      setLastReceived(data.shipment);
      setPending(null);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["shipments", "hub"] });
      toast.success(`${data.shipment.trackingId} received at this hub`);
      inputRef.current?.focus();
    } catch {
      setError("Network error.");
    } finally {
      setConfirming(false);
    }
  }

  function cancelPending() {
    setPending(null);
    setError(null);
  }

  const displayShipment = pending ?? lastReceived;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Intake & Scan
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" /> LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Scan or type a tracking ID, verify the shipment, then mark it received — writes directly to the database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Actively Scanned At Hub <PackageCheck className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.arrived}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Awaiting Intake Scan <Box className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.awaitingIntake}</div>
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
            1 · Scan or enter tracking ID
          </div>
          <form onSubmit={lookup} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="e.g. SLXDY868F3CRH"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 text-xs font-mono bg-background"
              autoFocus
            />
            <Button type="submit" className="h-10 text-xs gap-1.5 px-4" disabled={lookingUp}>
              <Search className="h-4 w-4" /> {lookingUp ? "Looking up…" : "Look up"}
            </Button>
          </form>
          <BarcodeScanner
            onDetected={(text) => {
              setCode(text);
              lookup();
            }}
          />

          {awaitingIntakeList.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Active bookings awaiting intake:</span>
                <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                  {awaitingIntakeList.length} ready
                </Badge>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {awaitingIntakeList.map((b: any) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setCode(b.trackingId);
                      setPending(b);
                      setError(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md border text-xs hover:bg-muted/40 flex items-center justify-between transition-colors group"
                  >
                    <span className="font-mono font-medium text-primary group-hover:underline">{b.trackingId}</span>
                    <span className="text-muted-foreground text-[11px]">{b.senderCity} → {b.receiverCity}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 border rounded-xl p-5 bg-card space-y-4 shadow-sm">
          {displayShipment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {pending ? "2 · Verify before marking received" : "Last received"}
                  </div>
                  <div className="font-mono text-xl font-bold text-foreground mt-0.5 flex items-center gap-2">
                    {displayShipment.trackingId}
                    {displayShipment.packageType === "medical" && (
                      <Badge variant="outline" className="text-[10px] bg-medical/10 text-medical border-medical/25">
                        Medical Priority
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium capitalize ${
                    pending ? "bg-warning/10 text-warning-foreground border-warning/25" : "bg-success/10 text-success border-success/25"
                  }`}
                >
                  {pending ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {pending ? displayShipment.status.replace(/_/g, " ") : "Arrived at hub"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Origin</div>
                  <div className="font-medium text-foreground mt-0.5">{displayShipment.senderCity}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Destination</div>
                  <div className="font-medium text-foreground mt-0.5">{displayShipment.receiverCity}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Category</div>
                  <div className="font-medium text-foreground mt-0.5 capitalize">{displayShipment.packageType}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Weight</div>
                  <div className="font-medium text-foreground mt-0.5">{displayShipment.weightKg} kg</div>
                </div>
              </div>

              {pending ? (
                <div className="flex items-center gap-2 pt-1">
                  <Button className="gap-1.5 h-9 text-xs" disabled={confirming} onClick={confirmReceived}>
                    <CheckCircle2 className="h-4 w-4" /> {confirming ? "Marking received…" : "Mark Received"}
                  </Button>
                  <Button variant="outline" className="h-9 text-xs" disabled={confirming} onClick={cancelPending}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md flex items-center justify-between gap-2">
                  <span>Next: assign an agent from Dispatch, or start a hub transfer.</span>
                  <Link to="/hub/shipments/$trackingId" params={{ trackingId: displayShipment.trackingId }} className="font-medium text-foreground hover:underline shrink-0">
                    View details →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full grid place-items-center text-center text-muted-foreground text-xs py-16">
              <div>
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Look up a tracking ID to verify it here before marking it received.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Actively scanned bookings at hub</h2>
            <p className="text-xs text-muted-foreground">Only shows verified parcels that have been scanned and received on the floor.</p>
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
                <TableHead className="text-xs font-medium">Priority</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && scannedHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    No intaken shipments yet. Look up or click an active booking above to mark it received.
                  </TableCell>
                </TableRow>
              )}
              {scannedHistory.map((p: any) => (
                <TableRow key={p.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-mono font-semibold text-foreground text-xs py-3">
                    <Link to="/hub/shipments/$trackingId" params={{ trackingId: p.trackingId }} className="hover:underline">
                      {p.trackingId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{p.senderCity} → {p.receiverCity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{p.packageType} · {p.weightKg} kg</TableCell>
                  <TableCell><PriorityBadge priority={p.priority} /></TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-medium bg-success/10 text-success border-success/25 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {p.status === "arrived_hub" ? "Scanned & In Hub" : p.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
