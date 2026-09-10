import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useShipments, toBadgeStatus, toProgress } from "@/lib/api-hooks";
import { StatCard } from "@/components/shiplync/StatCard";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/customer/")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const { data: shipments = [], isLoading } = useShipments("mine");

  const active = shipments.filter((s: any) => s.status !== "delivered" && s.status !== "returned" && s.status !== "cancelled");
  const deliveredThisMonth = shipments.filter((s: any) => {
    if (s.status !== "delivered" || !s.deliveredAt) return false;
    const d = new Date(s.deliveredAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const featured = active[0] ?? shipments[0];

  const handleBookShipment = () => {
    if (isAuthenticated) {
      navigate({ to: "/customer/book" });
    } else {
      openAuthModal(() => navigate({ to: "/customer/book" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Good afternoon{user ? `, ${user.name.split(" ")[0]}` : ""}
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Your logistics, in real time.</h1>
        </div>
        <Button onClick={handleBookShipment} className="gap-1.5 cursor-pointer">
          Book new shipment <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active" value={active.length} icon={<Package />} hint="Currently in the pipeline" />
        <StatCard label="In transit" value={active.filter((s: any) => s.status === "in_transit").length} icon={<Truck />} />
        <StatCard label="Delivered this month" value={String(deliveredThisMonth)} icon={<CheckCircle2 />} />
        <StatCard label="Total shipments" value={String(shipments.length)} icon={<Clock />} />
      </div>

      {featured ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Featured shipment</div>
                <div className="font-display text-lg font-semibold mt-0.5">{featured.trackingId}</div>
                <div className="text-sm text-muted-foreground">
                  {featured.senderCity} → {featured.receiverCity} · {featured.packageType}
                </div>
              </div>
              <StatusBadge status={toBadgeStatus(featured.status)} />
            </div>
            <RouteMap from={featured.senderCity} to={featured.receiverCity} progress={toProgress(featured.status)} className="h-72" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">ETA</div>
                <div className="text-sm font-medium mt-0.5">
                  {featured.estimatedDeliveryAt ? new Date(featured.estimatedDeliveryAt).toLocaleString() : "TBD"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Cost</div>
                <div className="text-sm font-medium mt-0.5">₹{featured.cost}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Priority</div>
                <div className="text-sm font-medium mt-0.5 capitalize">{featured.priority}</div>
              </div>
            </div>
            <div className="mt-3">
              <Link to="/customer/track/$id" params={{ id: featured.trackingId }}>
                <Button variant="outline" size="sm" className="gap-1.5">Open live tracker <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="card-elevated p-10 text-center">
            <div className="text-sm font-medium">No shipments yet</div>
            <div className="text-xs text-muted-foreground mt-1">Book your first shipment to see it tracked here.</div>
            <Button onClick={handleBookShipment} className="mt-4 gap-1.5">
              Book a shipment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )
      )}

      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div className="font-display font-semibold">Active shipments</div>
            <div className="text-xs text-muted-foreground">From your account, real-time</div>
          </div>
          <Link to="/customer/shipments" className="text-xs text-primary font-medium hover:underline">View all →</Link>
        </div>
        <div className="divide-y">
          {active.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-muted-foreground">No active shipments.</div>
          )}
          {active.map((s: any) => (
            <Link
              key={s.id}
              to="/customer/track/$id"
              params={{ id: s.trackingId }}
              className="grid grid-cols-12 items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="col-span-3">
                <div className="text-xs text-muted-foreground font-mono">{s.trackingId}</div>
                <div className="text-sm font-medium mt-0.5">{s.senderCity} → {s.receiverCity}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground capitalize">{s.packageType} · {s.weightKg} kg</div>
              <div className="col-span-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: toProgress(s.status) + "%" }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{toProgress(s.status)}% complete</div>
              </div>
              <div className="col-span-2 text-xs">
                {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString() : "TBD"}
              </div>
              <div className="col-span-2 flex justify-end"><StatusBadge status={toBadgeStatus(s.status)} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
