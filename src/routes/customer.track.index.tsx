import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useShipments, toBadgeStatus, toProgress } from "@/lib/api-hooks";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/track/")({
  head: () => ({
    meta: [
      { title: "Track shipment — ShipLync" },
      { name: "description", content: "Real-time parcel tracking with live status and event history." },
    ],
  }),
  component: TrackIndexPage,
});

function TrackIndexPage() {
  const navigate = useNavigate();
  const { data: myShipments = [] } = useShipments("mine");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const res = await fetch(`/api/shipments/track/${encodeURIComponent(q)}`);
    if (res.ok) {
      navigate({ to: "/customer/track/$id", params: { id: q } });
    } else {
      toast.error("No shipment found with that tracking ID.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Tracking</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Track a shipment</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Enter a tracking ID, or pick one of your shipments below.
        </p>
      </div>

      <div className="card-elevated p-5 sm:p-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter tracking ID (e.g. SLXA1B2C3D4)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background font-mono text-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-6 gap-2">
            Track <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {myShipments.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" /> Your shipments
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myShipments.map((m: any) => (
              <Link
                key={m.id}
                to="/customer/track/$id"
                params={{ id: m.trackingId }}
                className="card-elevated p-4 block transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-mono text-xs text-muted-foreground truncate">{m.trackingId}</span>
                  <StatusBadge status={toBadgeStatus(m.status)} />
                </div>
                <div className="font-display font-semibold text-base">{m.senderCity} → {m.receiverCity}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{m.packageType} · {m.weightKg} kg</div>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${toProgress(m.status)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-elevated p-10 text-center">
          <div className="text-sm font-medium">Nothing to track yet</div>
          <div className="text-xs text-muted-foreground mt-1">Book a shipment, or enter a tracking ID above.</div>
        </div>
      )}
    </div>
  );
}
