import { createFileRoute } from "@tanstack/react-router";
import { useExceptions, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  Phone,
  MessageSquare,
  Building,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/exceptions")({
  head: () => ({
    meta: [
      { title: "Driver Exceptions — Delivery Partner" },
      { name: "description", content: "Report delivery delays, recipient unavailable incidents, and package return logs." },
    ],
  }),
  component: DriverExceptionsPage,
});

function DriverExceptionsPage() {
  const { data: exceptionLogs = [] } = useExceptions("mine");
  const queryClient = useQueryClient();

  const activeException = exceptionLogs[0];

  const handleResolveAction = async (id: string, actionName: string) => {
    const res = await fetch(`/api/exceptions/${id}/resolve`, { method: "PATCH" });
    if (!res.ok) {
      toast.error("Could not resolve exception");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["exceptions", "mine"] });
    toast.success(`Action executed for ${id.slice(0, 8)}: ${actionName}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Driver Exceptions & Delays <Badge variant="outline" className="font-mono text-xs">{exceptionLogs.length > 0 ? `${exceptionLogs.length} Active Issue${exceptionLogs.length > 1 ? "s" : ""}` : "All Clear"}</Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Report recipient door-lock issues, address errors, or return packages to the hub.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.success("Exported driver exception log")}
        >
          <Download className="h-3.5 w-3.5" /> Export Log
        </Button>
      </div>

      {/* Active Incident Resolution Card */}
      {activeException && (
        <div className="border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  ACTIVE INCIDENT #{activeException.id.slice(0, 8)}
                </span>
                <div className="font-display font-bold text-base text-foreground capitalize">
                  {activeException.type.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-100 dark:bg-amber-900/40 capitalize">
              {activeException.severity}
            </Badge>
          </div>

          <div className="border rounded-lg p-3 bg-card text-xs space-y-1">
            <div className="text-muted-foreground">{activeException.message}</div>
            <div className="font-mono text-[11px] text-muted-foreground mt-1">
              Tracking ID: {activeException.trackingId} · {new Date(activeException.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-foreground" /> Recommended Resolution Actions:
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 bg-background"
                onClick={() => handleResolveAction(activeException.id, "Nudge WhatsApp Sent")}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Send WhatsApp Nudge
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 bg-background"
                onClick={() => handleResolveAction(activeException.id, "Left at Guard Desk")}
              >
                <Building className="h-3.5 w-3.5" /> Leave at Security Desk
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 bg-background text-destructive"
                onClick={() => handleResolveAction(activeException.id, "Marked for Return to Hub")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Return to Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exception History Table */}
      <div className="space-y-3 pt-2">
        <h2 className="font-display text-base font-semibold text-foreground">
          Incident Audit History
        </h2>

        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Incident ID</TableHead>
                <TableHead className="text-xs font-medium">Tracking ID</TableHead>
                <TableHead className="text-xs font-medium">Type</TableHead>
                <TableHead className="text-xs font-medium">Message</TableHead>
                <TableHead className="text-xs font-medium">Time</TableHead>
                <TableHead className="text-xs font-medium">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptionLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    No open exceptions on your assigned shipments.
                  </TableCell>
                </TableRow>
              )}
              {exceptionLogs.map((e: any) => (
                <TableRow key={e.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">
                    {e.id.slice(0, 8)}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {e.trackingId}
                  </TableCell>

                  <TableCell className="font-medium text-foreground text-xs capitalize">
                    {e.type.replace(/_/g, " ")}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {e.message}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                      {e.severity}
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
