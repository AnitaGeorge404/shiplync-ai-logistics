import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useExceptions, useShipments } from "@/lib/api-hooks";
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
import { ShieldAlert, Search, RefreshCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions — Admin Dashboard" },
      { name: "description", content: "Real, rule-based exception detection and resolution for delayed or stalled shipments." },
    ],
  }),
  component: AdminExceptionsPage,
});

function formatDuration(from: string | Date): string {
  const ms = Date.now() - new Date(from).getTime();
  const hours = Math.floor(ms / 36e5);
  const mins = Math.floor((ms % 36e5) / 6e4);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function AdminExceptionsPage() {
  const { data: exceptions = [] } = useExceptions();
  const { data: shipments = [] } = useShipments("all");
  const queryClient = useQueryClient();
  const [detecting, setDetecting] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const shipmentById = useMemo(() => new Map(shipments.map((s: any) => [s.id, s])), [shipments]);

  const stats = useMemo(() => {
    const critical = exceptions.filter((e: any) => e.severity === "critical").length;
    const warning = exceptions.filter((e: any) => e.severity === "warning").length;
    const info = exceptions.filter((e: any) => e.severity === "info").length;
    return { total: exceptions.length, critical, warning, info };
  }, [exceptions]);

  const filtered = useMemo(() => {
    return exceptions.filter((e: any) => {
      const matchesSearch =
        e.type.toLowerCase().includes(search.toLowerCase()) || e.message.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [exceptions, search, severityFilter]);

  async function runDetection() {
    setDetecting(true);
    try {
      const res = await fetch("/api/exceptions/detect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Detection failed");
        return;
      }
      toast.success(
        data.created?.length
          ? `Detected ${data.created.length} new exception(s) from live shipment data.`
          : "No new exceptions found — all monitored shipments are within thresholds.",
      );
      queryClient.invalidateQueries({ queryKey: ["exceptions", "all"] });
    } finally {
      setDetecting(false);
    }
  }

  async function resolve(id: string) {
    await fetch(`/api/exceptions/${id}/resolve`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["exceptions", "all"] });
    toast.success("Exception resolved");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exceptions</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Rule-based detection across live shipments: stationary &gt;48h, past ETA, or repeated failed attempts.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={runDetection} disabled={detecting}>
          <RefreshCcw className="h-3.5 w-3.5" /> {detecting ? "Scanning…" : "Run detection now"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Open exceptions <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Critical</div>
          <div className="text-2xl font-semibold mt-2 text-destructive">{stats.critical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Warning</div>
          <div className="text-2xl font-semibold mt-2 text-warning-foreground">{stats.warning}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium">Informational</div>
          <div className="text-2xl font-semibold mt-2">{stats.info}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search exception type or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs bg-background">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Informational</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Severity</TableHead>
              <TableHead className="text-xs font-medium">Shipment</TableHead>
              <TableHead className="text-xs font-medium">Type</TableHead>
              <TableHead className="text-xs font-medium">Duration</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-32 text-right text-xs font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-10">
                  No open exceptions match this filter.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((e: any) => {
              const shipment = e.shipmentId ? shipmentById.get(e.shipmentId) : null;
              return (
                <TableRow key={e.id} className="text-xs hover:bg-muted/20">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-warning" : "bg-primary"
                        }`}
                      />
                      <span className="font-medium capitalize">{e.severity}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 max-w-[220px]">{e.message}</div>
                  </TableCell>
                  <TableCell>
                    {shipment ? (
                      <Link
                        to="/admin/shipments/$trackingId"
                        params={{ trackingId: shipment.trackingId }}
                        className="font-mono text-primary hover:underline"
                      >
                        {shipment.trackingId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium capitalize">{e.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">{formatDuration(e.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {e.resolved ? "Resolved" : "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => resolve(e.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
