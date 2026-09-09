import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useExceptions, useQueryClient } from "@/lib/api-hooks";
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

function HubExceptionsPage() {
  const { data: exceptions = [] } = useExceptions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e: any) => {
      const matchesSearch =
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        (e.type ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [exceptions, search, severityFilter]);

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Hub Exceptions <Badge variant="outline" className="font-mono text-xs">{stats.total} Open</Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            System-detected exceptions: stationary shipments, delayed beyond ETA, repeated failed deliveries.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={handleDetect}
        >
          <Sparkles className="h-3.5 w-3.5" /> Run detection
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Open <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Critical <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-red-600 dark:text-red-400">{stats.critical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Warning <Wrench className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-amber-600 dark:text-amber-400">{stats.warning}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search exception ID or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
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

      {/* Exceptions Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Incident ID</TableHead>
              <TableHead className="text-xs font-medium">Type</TableHead>
              <TableHead className="text-xs font-medium">Message</TableHead>
              <TableHead className="text-xs font-medium">Severity</TableHead>
              <TableHead className="text-xs font-medium">Reported</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExceptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  No open exceptions. Run detection to check for new ones.
                </TableCell>
              </TableRow>
            )}
            {filteredExceptions.map((e: any) => (
              <TableRow key={e.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">{e.id.slice(0, 8)}</TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                    {e.type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell className="max-w-[300px] text-xs text-foreground truncate">
                  {e.message}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.severity === "critical"
                          ? "bg-red-500"
                          : e.severity === "warning"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium text-xs capitalize">{e.severity}</span>
                  </div>
                </TableCell>

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
    </div>
  );
}
