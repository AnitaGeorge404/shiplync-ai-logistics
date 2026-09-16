import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useShipments, toBadgeStatus } from "@/lib/api-hooks";
import { statusLabel } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, KeyRound } from "lucide-react";
import { getDeliveryOtp } from "@/lib/otp";

export const Route = createFileRoute("/customer/shipments")({
  head: () => ({ meta: [{ title: "Shipment history — ShipLync" }, { name: "description", content: "All your ShipLync shipments." }] }),
  component: History,
});

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];

function History() {
  const { data: shipments = [], isLoading } = useShipments("mine");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shipments.filter((s: any) => {
      const matchesStatus = status === "all" || toBadgeStatus(s.status) === status;
      const matchesSearch =
        !q ||
        s.trackingId.toLowerCase().includes(q) ||
        s.senderCity.toLowerCase().includes(q) ||
        s.receiverCity.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [shipments, search, status]);

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

      <div className="card-elevated p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 border-0 bg-transparent focus-visible:ring-0"
            placeholder="Search by tracking ID or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48 border-0 sm:border sm:border-l bg-transparent">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="card-elevated p-10 text-center text-sm text-muted-foreground">
          {shipments.length === 0 ? "No shipments yet — book your first one." : "No shipments match your filters."}
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="card-elevated overflow-hidden hidden md:block">
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
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to="/customer/track/$id"
                        params={{ id: s.trackingId }}
                        className="font-mono text-xs text-primary hover:underline block font-semibold"
                      >
                        {s.trackingId}
                      </Link>
                      {s.status !== "delivered" && s.status !== "cancelled" && s.status !== "returned" && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-primary/10 text-primary border border-primary/25 rounded px-1.5 py-0.5 font-semibold mt-1">
                          <KeyRound className="h-2.5 w-2.5" /> OTP: {s.deliveryOtp || getDeliveryOtp(s.trackingId)}
                        </span>
                      )}
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
                    <td className="px-5 py-4 text-right"><StatusBadge status={toBadgeStatus(s.status)} className="ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((s: any) => (
              <Link
                key={s.id}
                to="/customer/track/$id"
                params={{ id: s.trackingId }}
                className="card-elevated p-4 space-y-2 block"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-primary font-semibold">{s.trackingId}</span>
                    {s.status !== "delivered" && s.status !== "cancelled" && s.status !== "returned" && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-primary/10 text-primary border border-primary/25 rounded px-1.5 py-0.5 font-semibold">
                        <KeyRound className="h-2.5 w-2.5" /> OTP: {s.deliveryOtp || getDeliveryOtp(s.trackingId)}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={toBadgeStatus(s.status)} />
                </div>
                <div className="text-sm font-medium">{s.senderCity} → {s.receiverCity}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {s.packageType} · {s.weightKg} kg · Booked {new Date(s.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">
                    {s.status === "delivered" && s.deliveredAt
                      ? `Delivered ${new Date(s.deliveredAt).toLocaleDateString()}`
                      : s.estimatedDeliveryAt
                        ? `ETA ${new Date(s.estimatedDeliveryAt).toLocaleDateString()}`
                        : "ETA —"}
                  </span>
                  <span className="font-medium">₹{s.cost}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
