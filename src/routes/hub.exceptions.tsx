import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  Printer,
  CheckCircle2,
  Sparkles,
  Download,
  Wrench,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hub/exceptions")({
  head: () => ({
    meta: [
      { title: "Hub Exceptions & Damages — Hub Operations" },
      { name: "description", content: "Manage damaged packaging, unreadable barcodes, weight discrepancies, and sorting exceptions." },
    ],
  }),
  component: HubExceptionsPage,
});

export interface HubException {
  id: string;
  tracking: string;
  category: "Packaging Damaged" | "Unreadable Barcode" | "Weight Discrepancy" | "Address Error";
  operator: string;
  action: string;
  status: "Open" | "In Repair" | "Resolved";
  reportedTime: string;
}

const INITIAL_EXCEPTIONS: HubException[] = [
  { id: "HEX-101", tracking: "SLX-77430-IN", category: "Packaging Damaged", operator: "Ravi K.", action: "Repackage box at Bay 3 & re-seal", status: "Open", reportedTime: "18 min ago" },
  { id: "HEX-102", tracking: "SLX-77431-IN", category: "Unreadable Barcode", operator: "Anita S.", action: "Generate & print new Code-128 sticker", status: "In Repair", reportedTime: "32 min ago" },
  { id: "HEX-103", tracking: "SLX-77434-IN", category: "Weight Discrepancy", operator: "Priya R.", action: "Re-weigh on digital scale (+0.8 kg variance)", status: "Open", reportedTime: "45 min ago" },
  { id: "HEX-104", tracking: "SLX-77440-IN", category: "Address Error", operator: "Suresh N.", action: "Verify landmark pincode with recipient", status: "Resolved", reportedTime: "2 hrs ago" },
  { id: "HEX-105", tracking: "SLX-77445-IN", category: "Packaging Damaged", operator: "Vikram M.", action: "Repackage in heavy-duty polybag", status: "Resolved", reportedTime: "3 hrs ago" },
];

function HubExceptionsPage() {
  const [exceptions, setExceptions] = useState<HubException[]>(INITIAL_EXCEPTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e) => {
      const matchesSearch =
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.tracking.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exceptions, search, statusFilter]);

  const stats = useMemo(() => {
    const total = exceptions.length;
    const open = exceptions.filter((e) => e.status === "Open").length;
    const inRepair = exceptions.filter((e) => e.status === "In Repair").length;
    const resolved = exceptions.filter((e) => e.status === "Resolved").length;

    return { total, open, inRepair, resolved };
  }, [exceptions]);

  const handleResolve = (id: string, tracking: string) => {
    setExceptions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e))
    );
    toast.success(`Exception ${id} resolved for ${tracking}`);
  };

  const handleReprint = (tracking: string) => {
    toast.success(`Generated & printed new barcode label for ${tracking}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Hub Exceptions & Damages <Badge variant="outline" className="font-mono text-xs">{stats.open} Open</Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Resolve unreadable barcodes, damaged packaging, weight variances, and sorting errors.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.success("Exported exceptions log")}
        >
          <Download className="h-3.5 w-3.5" /> Export Log
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Incidents <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Open Queue <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-amber-600 dark:text-amber-400">{stats.open}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            In Repair / Repackage <Wrench className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.inRepair}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Resolved Today <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.resolved}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search exception ID, tracking, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Incidents</SelectItem>
            <SelectItem value="Open">Open Queue</SelectItem>
            <SelectItem value="In Repair">In Repair</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exceptions Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Incident ID & Parcel</TableHead>
              <TableHead className="text-xs font-medium">Category</TableHead>
              <TableHead className="text-xs font-medium">Reported By</TableHead>
              <TableHead className="text-xs font-medium">Recommended Action</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExceptions.map((e) => (
              <TableRow key={e.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="font-mono font-semibold text-foreground text-xs">{e.id}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{e.tracking}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                    {e.category}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {e.operator}
                </TableCell>

                <TableCell className="max-w-[260px] text-xs text-foreground font-medium truncate">
                  {e.action}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.status === "Open"
                          ? "bg-amber-500"
                          : e.status === "In Repair"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-medium text-xs">{e.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        {e.id}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {e.status !== "Resolved" && (
                        <DropdownMenuItem onClick={() => handleResolve(e.id, e.tracking)} className="gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleReprint(e.tracking)} className="gap-2 text-xs">
                        <Printer className="h-3.5 w-3.5" /> Re-print Barcode Label
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
  );
}
