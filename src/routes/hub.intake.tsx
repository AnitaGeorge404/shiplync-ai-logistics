import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ScanLine,
  PackageCheck,
  QrCode,
  Printer,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Camera,
  ShieldCheck,
  Box,
  Truck,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/intake")({
  head: () => ({
    meta: [
      { title: "Intake & Scan — Hub Operations" },
      { name: "description", content: "Barcode scanner, parcel intake logging, sorting bay assignment, and intake history." },
    ],
  }),
  component: HubIntakePage,
});

export interface ScannedParcel {
  id: string;
  tracking: string;
  origin: string;
  destination: string;
  type: string;
  weight: string;
  bay: string;
  medical: boolean;
  scanTime: string;
  status: "Scanned & In Bay" | "Needs Sorting" | "Exception Flagged";
}

const PRESET_PARCELS: Omit<ScannedParcel, "scanTime">[] = [
  { id: "P-101", tracking: "SLX-77420-IN", origin: "Mumbai (BOM)", destination: "Bengaluru (BLR)", type: "Express", weight: "2.4 kg", bay: "Bay 4 — South", medical: false, status: "Scanned & In Bay" },
  { id: "P-102", tracking: "SLX-77421-IN", origin: "Delhi (DEL)", destination: "Bengaluru (BLR)", type: "Medical", weight: "0.8 kg", bay: "Bay 1 — Priority Locked", medical: true, status: "Scanned & In Bay" },
  { id: "P-103", tracking: "SLX-77430-IN", origin: "Pune (PUN)", destination: "Whitefield (BLR)", type: "Fragile", weight: "5.6 kg", bay: "Bay 3 — East", medical: false, status: "Needs Sorting" },
  { id: "P-104", tracking: "SLX-77441-IN", origin: "Kochi (COK)", destination: "Indiranagar (BLR)", type: "Standard", weight: "12.0 kg", bay: "Bay 2 — Central", medical: false, status: "Scanned & In Bay" },
  { id: "P-105", tracking: "SLX-77455-IN", origin: "Hyderabad (HYD)", destination: "HSR Layout (BLR)", type: "Express", weight: "3.1 kg", bay: "Bay 4 — South", medical: false, status: "Scanned & In Bay" },
];

function HubIntakePage() {
  const [scannedParcels, setScannedParcels] = useState<ScannedParcel[]>([
    { ...PRESET_PARCELS[0], scanTime: "11:38 AM" },
    { ...PRESET_PARCELS[1], scanTime: "11:24 AM" },
    { ...PRESET_PARCELS[2], scanTime: "11:10 AM" },
  ]);

  const [scanInput, setScanInput] = useState("");
  const [activeParcel, setActiveParcel] = useState<ScannedParcel | null>(
    scannedParcels[0]
  );
  const [isScanning, setIsScanning] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = scannedParcels.length;
    const medical = scannedParcels.filter((p) => p.medical).length;
    const inBay = scannedParcels.filter((p) => p.status === "Scanned & In Bay").length;
    const exceptions = scannedParcels.filter((p) => p.status === "Exception Flagged").length;

    return { total, medical, inBay, exceptions };
  }, [scannedParcels]);

  // Filtered parcels for history
  const filteredHistory = useMemo(() => {
    return scannedParcels.filter((p) => {
      return (
        p.tracking.toLowerCase().includes(search.toLowerCase()) ||
        p.origin.toLowerCase().includes(search.toLowerCase()) ||
        p.destination.toLowerCase().includes(search.toLowerCase()) ||
        p.bay.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [scannedParcels, search]);

  const processScan = (codeToScan: string) => {
    if (!codeToScan.trim()) return;

    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      const code = codeToScan.trim().toUpperCase();

      // Check if matches existing preset or create dynamic
      const match = PRESET_PARCELS.find(
        (p) => p.tracking.toLowerCase() === code.toLowerCase()
      );

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      let parcelToSave: ScannedParcel;

      if (match) {
        parcelToSave = { ...match, scanTime: timeStr };
      } else {
        const isMed = code.includes("MED") || code.includes("99");
        const bayNum = Math.floor(1 + Math.random() * 5);
        parcelToSave = {
          id: `P-${Math.floor(100 + Math.random() * 900)}`,
          tracking: code.startsWith("SLX") ? code : `SLX-${code}`,
          origin: "Hub Intake",
          destination: "BLR Outbound",
          type: isMed ? "Medical" : "Standard",
          weight: "2.1 kg",
          bay: isMed ? "Bay 1 — Priority Locked" : `Bay ${bayNum} — Outbound`,
          medical: isMed,
          scanTime: timeStr,
          status: "Scanned & In Bay",
        };
      }

      // Add to front of history
      setScannedParcels((prev) => [
        parcelToSave,
        ...prev.filter((p) => p.tracking !== parcelToSave.tracking),
      ]);
      setActiveParcel(parcelToSave);
      setScanInput("");

      toast.success(`Scanned ${parcelToSave.tracking} → Assigned to ${parcelToSave.bay}`);
    }, 450);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(scanInput);
  };

  const handleSimulateNext = () => {
    const unScanned = PRESET_PARCELS.find(
      (p) => !scannedParcels.some((s) => s.tracking === p.tracking)
    );
    if (unScanned) {
      processScan(unScanned.tracking);
    } else {
      const randomCode = `SLX-${Math.floor(77400 + Math.random() * 100)}-IN`;
      processScan(randomCode);
    }
  };

  const handlePrintLabel = (tracking: string, bay: string) => {
    toast.success(`Printing sorting bay label for ${tracking} (${bay})`);
  };

  const handleFlagException = (tracking: string) => {
    setScannedParcels((prev) =>
      prev.map((p) => (p.tracking === tracking ? { ...p, status: "Exception Flagged" } : p))
    );
    toast.warning(`Flagged ${tracking} as Exception / Damaged`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Intake & Barcode Scanner
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> SCANNER READY
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Scan incoming parcels, automatically assign sorting bays, print routing labels, and log intake volume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleSimulateNext}
            disabled={isScanning}
          >
            <QrCode className="h-3.5 w-3.5" /> Simulate Barcode Scan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported intake log")}
          >
            <Download className="h-3.5 w-3.5" /> Export Log
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Today's Scanned Intake <PackageCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Assigned to Bays <Box className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.inBay}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.medical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Damaged / Exceptions <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.exceptions}</div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Scanner Viewfinder Box */}
        <div className="lg:col-span-5 border rounded-xl p-5 bg-card space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Camera className="h-4 w-4" /> Optical Laser Scanner
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Laser Active
              </Badge>
            </div>

            {/* Viewfinder Graphic */}
            <div className="relative rounded-lg border-2 border-dashed border-border bg-muted/30 h-52 grid place-items-center overflow-hidden">
              {/* Laser line animation */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              
              <div className="text-center space-y-2 z-10 px-4">
                <ScanLine className={`h-10 w-10 mx-auto text-foreground ${isScanning ? "animate-spin text-emerald-500" : ""}`} />
                <div className="text-xs font-medium text-foreground">
                  {isScanning ? "Decoding Barcode..." : "Position Barcode in Frame"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Supports Code-128, QR Code, Datamatrix & Handheld Laser Scanners
                </div>
              </div>
            </div>

            {/* Manual Scan Input Form */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
              <Input
                ref={inputRef}
                placeholder="Scan or type Tracking ID (e.g. SLX-77420-IN)..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="h-10 text-xs font-mono bg-background"
                autoFocus
              />
              <Button type="submit" className="h-10 text-xs gap-1.5 px-4" disabled={isScanning}>
                <ScanLine className="h-4 w-4" /> Scan
              </Button>
            </form>
          </div>

          <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Handheld USB Scanner plugged in</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSimulateNext}
              className="h-6 text-[11px] p-0 text-foreground"
            >
              Simulate Scan →
            </Button>
          </div>
        </div>

        {/* Live Scanned Package Detail Card */}
        <div className="lg:col-span-7 border rounded-xl p-5 bg-card space-y-4 shadow-sm flex flex-col justify-between">
          {activeParcel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Active Scanned Parcel
                  </div>
                  <div className="font-mono text-xl font-bold text-foreground mt-0.5 flex items-center gap-2">
                    {activeParcel.tracking}
                    {activeParcel.medical && (
                      <Badge variant="outline" className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800">
                        Medical Priority
                      </Badge>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {activeParcel.status}
                </Badge>
              </div>

              {/* Bay Assignment Highlight Banner */}
              <div className="border border-primary/20 bg-primary/5 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Target Sorting Bay Assignment
                  </div>
                  <div className="font-display text-lg font-bold text-foreground mt-0.5">
                    {activeParcel.bay}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handlePrintLabel(activeParcel.tracking, activeParcel.bay)}
                >
                  <Printer className="h-3.5 w-3.5" /> Print Bay Label
                </Button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Origin</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.origin}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Destination</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.destination}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Category</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.type}</div>
                </div>
                <div className="border rounded-md p-2.5 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Weight</div>
                  <div className="font-medium text-foreground mt-0.5">{activeParcel.weight}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-foreground" />
                <span>Next step: Place parcel in <strong>{activeParcel.bay}</strong> for line-haul dispatch.</span>
              </div>
            </div>
          ) : (
            <div className="h-full grid place-items-center text-center text-muted-foreground text-xs">
              <div>
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Scan a package barcode to view assigned sorting bay details.
              </div>
            </div>
          )}

          {activeParcel && (
            <div className="pt-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => handleFlagException(activeParcel.tracking)}
              >
                Flag Damaged / Exception
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Intake History Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Intake Scan History
            </h2>
            <p className="text-xs text-muted-foreground">
              Log of all parcels processed through the optical scanner today.
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by tracking ID or bay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Scan Time</TableHead>
                <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                <TableHead className="text-xs font-medium">Origin → Destination</TableHead>
                <TableHead className="text-xs font-medium">Type & Weight</TableHead>
                <TableHead className="text-xs font-medium">Assigned Sorting Bay</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((p) => (
                <TableRow
                  key={p.id}
                  className={`text-xs hover:bg-muted/30 ${
                    activeParcel?.id === p.id ? "bg-muted/50" : ""
                  }`}
                  onClick={() => setActiveParcel(p)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground py-3">
                    {p.scanTime}
                  </TableCell>

                  <TableCell className="font-mono font-semibold text-foreground text-xs">
                    {p.tracking}
                    {p.medical && (
                      <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1 border-red-200 text-red-600">
                        Med
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    {p.origin} → {p.destination}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {p.type} · {p.weight}
                  </TableCell>

                  <TableCell className="font-medium text-foreground">
                    {p.bay}
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-xs text-foreground">
                      {p.status}
                    </span>
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
                          {p.tracking}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePrintLabel(p.tracking, p.bay)} className="gap-2 text-xs">
                          <Printer className="h-3.5 w-3.5" /> Re-print Label
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFlagException(p.tracking)} className="gap-2 text-xs text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flag Exception
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
