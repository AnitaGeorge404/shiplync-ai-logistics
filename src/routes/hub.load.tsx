import { createFileRoute, Link } from "@tanstack/react-router";
import { useHubs } from "@/lib/api-hooks";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Warehouse, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/hub/load")({
  head: () => ({
    meta: [
      { title: "Hub Capacity — Hub Operations" },
      { name: "description", content: "Real inter-hub load — active shipments per hub against declared capacity." },
    ],
  }),
  component: HubLoadPage,
});

function HubLoadPage() {
  const { user } = useAuth();
  const { data: hubs = [], isLoading } = useHubs();
  const myHub = hubs.find((h: any) => h.id === user?.hubId);
  const otherHubs = hubs.filter((h: any) => h.id !== user?.hubId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Hub Capacity
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real active-shipment count per hub against its declared capacity, from the live database.
          </p>
        </div>
      </div>

      {myHub && (
        <div className="border rounded-lg p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">This hub</div>
              <div className="font-display text-xl font-semibold mt-0.5">{myHub.name}</div>
            </div>
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1 ${myHub.loadPct > 85 ? "border-destructive/30 text-destructive bg-destructive/10" : "border-border"}`}
            >
              {myHub.loadPct}% Load
            </Badge>
          </div>
          <Progress value={myHub.loadPct} className="h-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            {myHub.activeShipmentCount} active shipments / {myHub.capacity.toLocaleString()} capacity
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Warehouse className="h-4 w-4" /> Network hubs
        </div>

        {!isLoading && hubs.length === 0 && (
          <div className="border rounded-lg p-8 text-center text-xs text-muted-foreground bg-card">
            No hubs registered yet.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {otherHubs.map((h: any) => (
            <div key={h.id} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-base text-foreground">{h.code}</div>
                  <div className="text-xs text-muted-foreground">{h.name} · {h.city}</div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${h.loadPct > 85 ? "border-destructive/30 text-destructive" : "border-border"}`}
                >
                  {h.loadPct}% Load
                </Badge>
              </div>

              <Progress value={h.loadPct} className="h-1.5" />

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-muted-foreground">
                  {h.activeShipmentCount} active / {h.capacity.toLocaleString()} capacity
                </span>
                <Button size="sm" variant="ghost" className="h-7 text-xs p-0 text-foreground gap-1" asChild>
                  <Link to="/hub/transfers"><ArrowLeftRight className="h-3 w-3" /> Transfer here</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
