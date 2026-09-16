import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useShipments, toBadgeStatus, toProgress } from "@/lib/api-hooks";
import { StatCard } from "@/components/shiplync/StatCard";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, ArrowRight, MapPinned, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDeliveryOtp } from "@/lib/otp";

export const Route = createFileRoute("/customer/")({
  component: CustomerDashboard,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
            {greeting()}{user ? `, ${user.name.split(" ")[0]}` : ""}
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold">Your shipments, at a glance.</h1>
        </div>
        <Button onClick={handleBookShipment} className="gap-1.5 cursor-pointer">
          Book new shipment <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Active" value={active.length} icon={<Package />} hint="Currently in the pipeline" />
        <StatCard label="In transit" value={active.filter((s: any) => s.status === "in_transit").length} icon={<Truck />} />
        <StatCard label="Delivered this month" value={String(deliveredThisMonth)} icon={<CheckCircle2 />} />
        <StatCard label="Total shipments" value={String(shipments.length)} icon={<Clock />} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link to="/customer/track" className="card-elevated p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0"><Package className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-medium">Track a shipment</div>
            <div className="text-xs text-muted-foreground">Live status by tracking ID</div>
          </div>
        </Link>
        <Link to="/customer/addresses" className="card-elevated p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0"><MapPinned className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-medium">Saved addresses</div>
            <div className="text-xs text-muted-foreground">Manage pickup & delivery locations</div>
          </div>
        </Link>
      </div>

      {featured ? (
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Featured shipment</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-display text-lg font-semibold">{featured.trackingId}</span>
                {featured.status !== "delivered" && featured.status !== "cancelled" && featured.status !== "returned" && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs bg-primary/10 text-primary border border-primary/25 rounded px-2 py-0.5 font-semibold">
                    <KeyRound className="h-3 w-3" /> OTP: {featured.deliveryOtp || getDeliveryOtp(featured.trackingId)}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {featured.senderCity} → {featured.receiverCity} · {featured.packageType}
              </div>
            </div>
            <StatusBadge status={toBadgeStatus(featured.status)} />
          </div>
          <RouteMap from={featured.senderCity} to={featured.receiverCity} progress={toProgress(featured.status)} className="h-56 sm:h-72" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">ETA</div>
              <div className="text-sm font-medium mt-0.5 truncate">
                {featured.estimatedDeliveryAt ? new Date(featured.estimatedDeliveryAt).toLocaleDateString() : "TBD"}
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
              className="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2 sm:gap-3 px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between sm:block sm:col-span-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{s.trackingId}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                      <KeyRound className="h-2.5 w-2.5" /> OTP: {s.deliveryOtp || getDeliveryOtp(s.trackingId)}
                    </span>
                  </div>
                  <div className="text-sm font-medium mt-0.5">{s.senderCity} → {s.receiverCity}</div>
                </div>
                <div className="sm:hidden"><StatusBadge status={toBadgeStatus(s.status)} /></div>
              </div>
              <div className="sm:col-span-2 text-xs text-muted-foreground capitalize">{s.packageType} · {s.weightKg} kg</div>
              <div className="sm:col-span-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: toProgress(s.status) + "%" }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{toProgress(s.status)}% complete</div>
              </div>
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString() : "TBD"}
              </div>
              <div className="hidden sm:flex sm:col-span-2 justify-end"><StatusBadge status={toBadgeStatus(s.status)} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
