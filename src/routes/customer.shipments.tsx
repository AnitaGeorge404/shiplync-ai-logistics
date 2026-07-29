import { createFileRoute, Link } from "@tanstack/react-router";
import { shipments } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/customer/shipments")({
  head: () => ({ meta: [{ title: "Shipment history — ShipLync" }, { name: "description", content: "All your ShipLync shipments." }] }),
  component: History,
});

function History() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">History</div>
          <h1 className="font-display text-3xl font-semibold mt-1">All shipments</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Filter</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      <div className="card-elevated p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 border-0 bg-transparent focus-visible:ring-0" placeholder="Search by tracking ID, city, driver…" />
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
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <Link to="/customer/track/$id" params={{ id: s.id }} className="font-mono text-xs text-primary hover:underline">{s.tracking}</Link>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium">{s.fromCity} → {s.toCity}</div>
                  <div className="text-xs text-muted-foreground">{s.weight} kg</div>
                </td>
                <td className="px-5 py-4 text-xs">{s.packageType}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{s.bookedAt}</td>
                <td className="px-5 py-4 text-xs">{s.eta}</td>
                <td className="px-5 py-4 text-right font-medium">₹{s.price}</td>
                <td className="px-5 py-4 text-right"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
