import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useExceptions, useQueryClient } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  MessageSquare,
  Building,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/driver/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions — Delivery Partner" },
      {
        name: "description",
        content: "Recipient unavailable, address, or access issues on your assigned deliveries.",
      },
    ],
  }),
  component: DriverExceptionsPage,
});

const SEVERITY_TONE: Record<string, string> = {
  info: "bg-info/10 text-info border-info/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

type ExceptionEntry = {
  id: string;
  type: string;
  severity: string;
  message: string;
  trackingId: string;
  createdAt: string;
};

function DriverExceptionsPage() {
  const { data: exceptionLogs = [], isLoading } = useExceptions("mine");
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleResolveAction(id: string, actionName: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/exceptions/${id}/resolve`, { method: "PATCH" });
      if (!res.ok) {
        toast.error("Could not resolve exception");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["exceptions", "mine"] });
      setOpenId(null);
      toast.success(`Resolved: ${actionName}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Exceptions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issues on your assigned deliveries that need a decision.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-10 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking for issues…
        </div>
      )}

      {!isLoading && exceptionLogs.length === 0 && (
        <div className="border rounded-xl bg-card p-6 text-center">
          <ShieldCheck className="h-6 w-6 mx-auto text-success" />
          <div className="mt-2 text-sm font-medium">All clear</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            No open exceptions on your route.
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {(exceptionLogs as ExceptionEntry[]).map((e) => {
          const open = openId === e.id;
          return (
            <div key={e.id} className="border rounded-xl bg-card overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setOpenId(open ? null : e.id)}
              >
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm capitalize">
                      {e.type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        SEVERITY_TONE[e.severity] ?? SEVERITY_TONE.info,
                      )}
                    >
                      {e.severity}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{e.message}</div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    {e.trackingId} ·{" "}
                    {new Date(e.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-2 border-t pt-3">
                  <div className="text-xs font-semibold text-foreground">Resolve as:</div>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      className="h-10 justify-start gap-2 text-xs"
                      disabled={busyId === e.id}
                      onClick={() => handleResolveAction(e.id, "WhatsApp nudge sent")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Sent WhatsApp nudge
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 justify-start gap-2 text-xs"
                      disabled={busyId === e.id}
                      onClick={() => handleResolveAction(e.id, "Left at security desk")}
                    >
                      <Building className="h-3.5 w-3.5" /> Left at security desk
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 justify-start gap-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      disabled={busyId === e.id}
                      onClick={() => handleResolveAction(e.id, "Marked for return to hub")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Return to hub
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
