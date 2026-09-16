import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useUsers, useShipments, useHubs } from "@/lib/api-hooks";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Search, Package, CheckCircle2, ArrowRightCircle } from "lucide-react";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({
    meta: [
      { title: "Delivery Agents — Admin Command Center" },
      { name: "description", content: "Real agent workload, completion and failure rates, computed from live shipment assignments." },
    ],
  }),
  component: AdminAgentsPage,
});

const ACTIVE_STATUSES = ["picked_up", "arrived_hub", "in_transit", "out_for_delivery", "delivery_attempted"];

function AdminAgentsPage() {
  const navigate = useNavigate();
  const { data: users = [] } = useUsers();
  const { data: shipments = [] } = useShipments("all");
  const { data: hubs = [] } = useHubs();
  const [search, setSearch] = useState("");

  const hubById = useMemo(() => new Map(hubs.map((h: any) => [h.id, h])), [hubs]);

  const agentRows = useMemo(() => {
    const agents = users.filter((u: any) => u.role === "delivery_agent");
    const rows = agents.map((a: any) => {
      const assigned = shipments.filter((s: any) => s.assignedAgentId === a.id);
      const completed = assigned.filter((s: any) => s.status === "delivered").length;
      const failed = assigned.filter((s: any) => s.status === "returned" || s.status === "cancelled").length;
      const pending = assigned.filter((s: any) => ACTIVE_STATUSES.includes(s.status)).length;
      const resolved = completed + failed;
      const successRate = resolved > 0 ? Math.round((completed / resolved) * 100) : null;
      return { ...a, assigned: assigned.length, completed, failed, pending, successRate };
    });
    const maxPending = Math.max(1, ...rows.map((r) => r.pending));
    return rows.map((r) => ({ ...r, load: Math.round((r.pending / maxPending) * 100) }));
  }, [users, shipments]);

  const filtered = useMemo(
    () => agentRows.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [agentRows, search],
  );

  const stats = useMemo(() => {
    const totalAssigned = agentRows.reduce((acc, a) => acc + a.assigned, 0);
    const totalPending = agentRows.reduce((acc, a) => acc + a.pending, 0);
    const idle = agentRows.filter((a) => a.assigned === 0).length;
    return { count: agentRows.length, totalAssigned, totalPending, idle };
  }, [agentRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Delivery Agents</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real workload and outcomes per agent, computed from live shipment assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Agents <UserCheck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.count}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Assigned <Package className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.totalAssigned}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            In Progress <ArrowRightCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.totalPending}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Idle Agents <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.idle}</div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search agents by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Agent</TableHead>
              <TableHead className="text-xs font-medium">Hub</TableHead>
              <TableHead className="text-xs font-medium text-right">Assigned</TableHead>
              <TableHead className="text-xs font-medium text-right">Completed</TableHead>
              <TableHead className="text-xs font-medium text-right">Pending</TableHead>
              <TableHead className="text-xs font-medium text-right">Failed</TableHead>
              <TableHead className="text-xs font-medium">Success rate</TableHead>
              <TableHead className="text-xs font-medium w-36">Load</TableHead>
              <TableHead className="w-28 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-10">
                  No delivery agents found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => (
              <TableRow key={a.id} className="text-xs hover:bg-muted/20">
                <TableCell className="py-3">
                  <div className="font-medium text-foreground">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.phone ?? "—"}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{a.hubId ? hubById.get(a.hubId)?.code ?? "—" : "—"}</TableCell>
                <TableCell className="text-right font-mono">{a.assigned}</TableCell>
                <TableCell className="text-right font-mono text-success">{a.completed}</TableCell>
                <TableCell className="text-right font-mono">{a.pending}</TableCell>
                <TableCell className="text-right font-mono">
                  <span className={a.failed > 0 ? "text-destructive" : ""}>{a.failed}</span>
                </TableCell>
                <TableCell>
                  {a.successRate === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-normal">{a.successRate}%</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Progress value={a.load} className="h-1.5" />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={a.assigned === 0}
                    onClick={() => navigate({ to: "/admin/shipments", search: { agent: a.id } })}
                  >
                    View shipments
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
