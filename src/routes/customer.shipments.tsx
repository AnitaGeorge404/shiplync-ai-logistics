import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments } from "@/lib/api-hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/customer/shipments")({
  head: () => ({ meta: [{ title: "Shipment history — ShipLync" }, { name: "description", content: "All your ShipLync shipments." }] }),
  component: History,
});

function History() {
  const { data: shipments = [], isLoading } = useShipments("mine");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return shipments;
    return shipments.filter(
      (s: any) =>
        s.trackingId.toLowerCase().includes(q) ||
        s.senderCity.toLowerCase().includes(q) ||
        s.receiverCity.toLowerCase().includes(q),
    );
  }, [shipments, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">History</div>
          <h1 className="font-display text-3xl font-semibold mt-1">All shipments</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a href="/customer/invoices">View invoices</a>
        </Button>
      </div>

      <div className="card-elevated p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 border-0 bg-transparent focus-visible:ring-0"
            placeholder="Search by tracking ID or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Tracking</th>
              <th className="text-left px-5 py-3">Route</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">Booked</th>
              <th className="text-left px-5 py-3">ETA / Delivered</th>
              <th className="text-right px-5 py-3">Amount</th>
              <th className="text-right px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-xs text-muted-foreground">
                  {shipments.length === 0 ? "No shipments yet — book your first one." : "No shipments match your search."}
                </td>
              </tr>
            )}
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    to="/customer/track/$id"
                    params={{ id: s.trackingId }}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {s.trackingId}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium">{s.senderCity} → {s.receiverCity}</div>
                  <div className="text-xs text-muted-foreground">{s.weightKg} kg</div>
                </td>
                <td className="px-5 py-4 text-xs capitalize">{s.packageType}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-xs">
                  {s.status === "delivered" && s.deliveredAt
                    ? new Date(s.deliveredAt).toLocaleString()
                    : s.estimatedDeliveryAt
                      ? new Date(s.estimatedDeliveryAt).toLocaleString()
                      : "—"}
                </td>
                <td className="px-5 py-4 text-right font-medium">₹{s.cost}</td>
                <td className="px-5 py-4 text-right text-xs capitalize">{s.status.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
