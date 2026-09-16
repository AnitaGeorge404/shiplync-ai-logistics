import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useExceptions, useQueryClient } from "@/lib/api-hooks";
import { usePagedRows } from "@/hooks/use-paged-rows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { AlertTriangle, Search, CheckCircle2, Sparkles, Wrench } from "lucide-react";
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

const SEVERITY_DOT: Record<string, string> = { critical: "bg-destructive", warning: "bg-warning", info: "bg-info" };
const SEVERITY_TEXT: Record<string, string> = { critical: "text-destructive", warning: "text-warning-foreground", info: "text-info" };

// Short, scannable alert copy per exception type — "Critical — Shipment
// delayed 8h" rather than a raw type slug next to a paragraph.
function alertHeadline(e: any): string {
  if (e.type === "delayed_beyond_threshold") {
    const match = e.message.match(/(\d+)h/);
    return match ? `Shipment delayed ${match[1]}h` : "Shipment delayed";
  }
  if (e.type === "stationary_too_long") return "No status update in 48h+";
  if (e.type === "repeated_failed_delivery") return "Repeated failed delivery attempts";
  return e.type.replace(/_/g, " ");
}

function HubExceptionsPage() {
  const { data: exceptions = [] } = useExceptions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e: any) => {
      const matchesSearch =
        (e.trackingId ?? e.id).toLowerCase().includes(search.toLowerCase()) ||
        (e.type ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [exceptions, search, severityFilter]);

  const paged = usePagedRows(filteredExceptions, 10);

  const stats = useMemo(() => {
    const total = exceptions.length;
    const critical = exceptions.filter((e: any) => e.severity === "critical").length;
    const warning = exceptions.filter((e: any) => e.severity === "warning").length;
    return { total, critical, warning };
  }, [exceptions]);

  const handleResolve = async (id: string) => {
    const res = await fetch(`/api/exceptions/${id}/resolve`, { method: "PATCH" });
    if (!res.ok) {
      toast.error("Could not resolve exception");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["exceptions", "all"] });
    toast.success(`Exception ${id.slice(0, 8)} resolved`);
  };

  const handleDetect = async () => {
    const res = await fetch("/api/exceptions/detect", { method: "POST" });
    const data = await res.json().catch(() => ({ created: [] }));
    queryClient.invalidateQueries({ queryKey: ["exceptions", "all"] });
    toast.success(`Detection run: ${data.created?.length ?? 0} new exception(s) found`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Hub Exceptions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real, deterministic detection for shipments at this hub — stationary too long, delayed beyond ETA, repeated failed deliveries.
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handleDetect}>
          <Sparkles className="h-3.5 w-3.5" /> Run detection
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Open <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Critical <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-destructive">{stats.critical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Warning <Wrench className="h-4 w-4 text-warning-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-warning-foreground">{stats.warning}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tracking ID or type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); paged.resetPage(); }}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); paged.resetPage(); }}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Alert</TableHead>
              <TableHead className="text-xs font-medium">Shipment</TableHead>
              <TableHead className="text-xs font-medium">Type</TableHead>
              <TableHead className="text-xs font-medium">Reported</TableHead>
              <TableHead className="w-24 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                  No open exceptions at this hub. Run detection to check for new ones.
                </TableCell>
              </TableRow>
            )}
            {paged.pageRows.map((e: any) => (
              <TableRow key={e.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[e.severity] ?? "bg-muted-foreground"}`} />
                    <span className={`font-medium capitalize ${SEVERITY_TEXT[e.severity] ?? ""}`}>
                      {e.severity} — {alertHeadline(e)}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 ml-3.5">{e.message}</div>
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {e.trackingId ? (
                    <Link to="/hub/shipments/$trackingId" params={{ trackingId: e.trackingId }} className="hover:underline">
                      {e.trackingId}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground capitalize">{e.type.replace(/_/g, " ")}</TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleResolve(e.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {paged.pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            {Array.from({ length: paged.pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === paged.page} onClick={(e) => { e.preventDefault(); paged.setPage(p); }} href="#">
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
