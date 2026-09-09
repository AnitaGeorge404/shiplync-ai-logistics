import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { Bell, Package, CreditCard, Truck, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/customer/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ShipLync" },
      { name: "description", content: "Real-time updates on your ShipLync shipments." },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  shipmentId: string | null;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, any> = {
  shipment_booked: Package,
  payment_successful: CreditCard,
  agent_assigned: Truck,
  delivered: CheckCircle2,
  delivery_failed: AlertTriangle,
  route_changed: Truck,
};

function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications", "mine"],
    queryFn: async (): Promise<Notification[]> => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications ?? [];
    },
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Notifications</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Sign in to view notifications</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8 bg-background border rounded-2xl shadow-xl">
          <LoginForm compact />
        </div>
      </div>
    );
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Notifications</div>
          <h1 className="font-display text-3xl font-semibold mt-1">
            Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount} new)</span>}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">No notifications yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            You'll see booking confirmations, delivery updates, and alerts here.
          </div>
        </div>
      ) : (
        <div className="card-elevated divide-y overflow-hidden">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
