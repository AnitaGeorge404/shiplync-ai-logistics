import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { DeliveryRow } from "@/components/shiplync/driver/DeliveryRow";
import { useShipments } from "@/lib/api-hooks";
import { priorityTier, type RealShipment } from "@/lib/driver";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/driver/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Delivery Partner" },
      {
        name: "description",
        content: "All assigned deliveries — search, filter, and open any stop to act on it.",
      },
    ],
  }),
  component: DriverDeliveriesPage,
});

const FILTERS = ["All", "Pending", "Priority", "Completed", "Failed"] as const;
type Filter = (typeof FILTERS)[number];

function DriverDeliveriesPage() {
  const { data: shipments = [], isLoading } = useShipments("assigned") as {
    data: RealShipment[];
    isLoading: boolean;
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shipments.filter((s) => {
      const matchesSearch =
        !q ||
        s.trackingId.toLowerCase().includes(q) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.receiverAddressLine.toLowerCase().includes(q) ||
        s.receiverCity.toLowerCase().includes(q);

      const matchesFilter =
        filter === "All" ||
        (filter === "Completed" && s.status === "delivered") ||
        (filter === "Failed" && s.status === "delivery_attempted") ||
        (filter === "Priority" && priorityTier(s) !== null) ||
        (filter === "Pending" &&
          s.status !== "delivered" &&
          s.status !== "returned" &&
          s.status !== "cancelled" &&
          s.status !== "delivery_attempted");

      return matchesSearch && matchesFilter;
    });
  }, [shipments, search, filter]);

  const counts = useMemo(() => {
    return {
      All: shipments.length,
      Pending: shipments.filter(
        (s) =>
          s.status !== "delivered" &&
          s.status !== "returned" &&
          s.status !== "cancelled" &&
          s.status !== "delivery_attempted",
      ).length,
      Priority: shipments.filter((s) => priorityTier(s) !== null).length,
      Completed: shipments.filter((s) => s.status === "delivered").length,
      Failed: shipments.filter((s) => s.status === "delivery_attempted").length,
    } satisfies Record<Filter, number>;
  }, [shipments]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Deliveries</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {shipments.length} assigned · tap a stop to act on it
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search tracking ID, name, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-10 text-sm"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition-colors",
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground hover:bg-muted/50",
            )}
          >
            {f} <span className="opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="border rounded-lg bg-card divide-y overflow-hidden">
        {isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading deliveries…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No deliveries match your filters.
          </div>
        )}
        {filtered.map((s) => (
          <DeliveryRow key={s.id} shipment={s} />
        ))}
      </div>
    </div>
  );
}
