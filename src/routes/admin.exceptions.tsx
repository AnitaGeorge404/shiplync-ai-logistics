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
  ShieldAlert,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions Queue — Admin Dashboard" },
      { name: "description", content: "Manage delivery delays, exceptions, rerouting recommendations, and incident audits." },
    ],
  }),
  component: AdminExceptionsPage,
});

export interface ExceptionItem {
  id: string;
  tracking: string;
  route: string;
  category: "Weather Delay" | "Traffic Congestion" | "Address Issue" | "Vehicle Issue" | "Medical Locked";
  severity: "High" | "Medium" | "Low";
  recommendation: string;
  status: "Open" | "In Resolution" | "Resolved";
  reportedTime: string;
}

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  { id: "EXC-501", tracking: "SLX-77420-IN", route: "Mumbai → Pune", category: "Traffic Congestion", severity: "High", recommendation: "Reroute via NH-48 Express Bypass (-40 min)", status: "Open", reportedTime: "12 min ago" },
  { id: "EXC-502", tracking: "SLX-77421-IN", route: "Delhi → Gurgaon", category: "Medical Locked", severity: "High", recommendation: "Priority lane assigned to Rider Anita Sharma", status: "In Resolution", reportedTime: "24 min ago" },
  { id: "EXC-503", tracking: "SLX-77424-IN", route: "Bengaluru → Electronic City", category: "Weather Delay", severity: "Medium", recommendation: "Extend SLA by 15m; nudge customer", status: "Open", reportedTime: "35 min ago" },
  { id: "EXC-504", tracking: "SLX-77430-IN", route: "Chennai → West", category: "Address Issue", severity: "Low", recommendation: "Verify landmark with recipient via SMS", status: "Open", reportedTime: "1 hr ago" },
  { id: "EXC-505", tracking: "SLX-77435-IN", route: "Kochi → Ernakulam", category: "Vehicle Issue", severity: "Medium", recommendation: "Transfer cargo to EV Van KA-05-2210", status: "Resolved", reportedTime: "2 hrs ago" },
];

function AdminExceptionsPage() {
  const [exceptionList, setExceptionList] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const filteredExceptions = useMemo(() => {
    return exceptionList.filter((e) => {
      const matchesSearch =
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.tracking.toLowerCase().includes(search.toLowerCase()) ||
        e.route.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [exceptionList, search, severityFilter]);

  const stats = useMemo(() => {
    const total = exceptionList.length;
    const openCount = exceptionList.filter((e) => e.status === "Open").length;
    const highCount = exceptionList.filter((e) => e.severity === "High").length;
    const resolvedCount = exceptionList.filter((e) => e.status === "Resolved").length;

    return { total, openCount, highCount, resolvedCount };
  }, [exceptionList]);

  const handleApplyAI = (id: string, tracking: string, rec: string) => {
    setExceptionList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e))
    );
    toast.success(`Applied AI Fix for ${tracking}: ${rec}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Exceptions Queue <Badge variant="outline" className="font-mono text-xs">{stats.openCount} Open</Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time incident audit queue, AI rerouting suggestions, and exception resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported exceptions audit log")}
          >
            <Download className="h-3.5 w-3.5" /> Export Audit Log
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Active Incidents <ShieldAlert className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            High Severity <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2 text-amber-600 dark:text-amber-400">
            {stats.highCount}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Pending Resolution <RefreshCcw className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.openCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Resolved Today <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.resolvedCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search exception ID, tracking, route..."
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
            <SelectItem value="High">High Severity</SelectItem>
            <SelectItem value="Medium">Medium Severity</SelectItem>
            <SelectItem value="Low">Low Severity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exceptions Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Incident ID & Parcel</TableHead>
              <TableHead className="text-xs font-medium">Route</TableHead>
              <TableHead className="text-xs font-medium">Category</TableHead>
              <TableHead className="text-xs font-medium">Severity</TableHead>
              <TableHead className="text-xs font-medium">AI Reroute Recommendation</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExceptions.map((e) => (
              <TableRow key={e.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {e.id}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{e.tracking}</div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {e.route}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                    {e.category}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.severity === "High"
                          ? "bg-red-500"
                          : e.severity === "Medium"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium text-xs">{e.severity}</span>
                  </div>
                </TableCell>

                <TableCell className="max-w-[260px]">
                  <div className="text-xs text-foreground flex items-center gap-1 font-medium">
                    <Sparkles className="h-3 w-3 shrink-0 text-foreground" />
                    <span className="truncate">{e.recommendation}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-xs">{e.status}</span>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 text-xs">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        {e.id}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {e.status !== "Resolved" && (
                        <DropdownMenuItem onClick={() => handleApplyAI(e.id, e.tracking, e.recommendation)} className="gap-2 text-xs">
                          <Sparkles className="h-3.5 w-3.5" /> Execute AI Reroute
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast.info(`Contacting driver for ${e.tracking}`)} className="gap-2 text-xs">
                        Contact Driver
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
