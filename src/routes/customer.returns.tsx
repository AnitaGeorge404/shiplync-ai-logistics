import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/customer/returns")({
  head: () => ({
    meta: [
      { title: "Returns — ShipLync" },
      { name: "description", content: "Shipments returned to sender." },
    ],
  }),
  component: ReturnsPage,
});

type ShipmentRow = {
  id: string;
  trackingId: string;
  status: string;
  cost: number;
  senderCity: string;
  receiverCity: string;
  updatedAt: string;
};

function ReturnsPage() {
  const { isAuthenticated } = useAuth();
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments", "mine"],
    queryFn: async (): Promise<ShipmentRow[]> => {
      const res = await fetch("/api/shipments");
      if (!res.ok) return [];
      const data = await res.json();
      return data.shipments ?? [];
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Returns</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Sign in to view returns</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8 bg-background border rounded-2xl shadow-xl">
          <LoginForm compact />
        </div>
      </div>
    );
  }

  const returned = shipments.filter((s) => s.status === "returned");
  const atRisk = shipments.filter((s) => s.status === "delivery_attempted");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Returns</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Returns & failed deliveries</h1>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : returned.length === 0 && atRisk.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">No returns</div>
          <div className="text-sm text-muted-foreground mt-1">
            Every shipment so far has been delivered or is still on its way.
          </div>
        </div>
      ) : (
        <>
          {atRisk.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Delivery attempted — awaiting reschedule</div>
              {atRisk.map((s) => (
                <Row key={s.id} s={s} />
              ))}
            </div>
          )}
          {returned.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Returned to sender</div>
              {returned.map((s) => (
                <Row key={s.id} s={s} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ s }: { s: ShipmentRow }) {
  return (
    <div className="card-elevated p-4 flex items-center justify-between">
      <div>
        <Link
          to="/customer/track/$id"
          params={{ id: s.trackingId }}
          className="font-mono text-xs text-primary hover:underline"
        >
          {s.trackingId}
        </Link>
        <div className="text-sm mt-0.5">
          {s.senderCity} → {s.receiverCity}
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {new Date(s.updatedAt).toLocaleString()} · ₹{s.cost.toFixed(2)}
        </div>
      </div>
      <StatusBadge status={s.status === "returned" ? "returned" : "exception"} />
    </div>
  );
}
