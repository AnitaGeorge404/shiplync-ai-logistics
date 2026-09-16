import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { RequireAuth } from "@/components/shiplync/RequireAuth";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { useExceptions, useNotifications } from "@/lib/api-hooks";
import {
  LayoutDashboard,
  Package,
  UserCheck,
  Warehouse,
  Truck,
  ShieldAlert,
  Bell,
  LineChart,
  BarChart3,
  Users,
  CreditCard,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ShipLync" }, { name: "description", content: "Nationwide logistics operations: fleet, hubs, revenue and exceptions." }] }),
  notFoundComponent: () => <ComingSoon title="Admin module — coming soon" back="/admin" />,
  component: AdminLayout,
});

function AdminLayout() {
  const { data: exceptions = [] } = useExceptions();
  const { data: notifs = [] } = useNotifications();
  const unreadNotifs = notifs.filter((n: any) => !n.read).length;

  return (
    <RequireAuth roles={["admin"]}>
      <PortalShell
        portal="Admin"
        nav={[
          { to: "/admin", label: "Command center", icon: <LayoutDashboard />, section: "Overview" },
          { to: "/admin/shipments", label: "Shipments", icon: <Package />, section: "Operations" },
          { to: "/admin/agents", label: "Agents", icon: <UserCheck />, section: "Operations" },
          { to: "/admin/hubs", label: "Hubs", icon: <Warehouse />, section: "Network" },
          { to: "/admin/fleet", label: "Vehicles", icon: <Truck />, section: "Network" },
          { to: "/admin/exceptions", label: "Exceptions", icon: <ShieldAlert />, section: "Monitoring", badge: exceptions.length > 0 ? String(exceptions.length) : undefined },
          { to: "/admin/notifications", label: "Notifications", icon: <Bell />, section: "Monitoring", badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined },
          { to: "/admin/analytics", label: "Analytics", icon: <LineChart />, section: "Insights" },
          { to: "/admin/reports", label: "Reports", icon: <BarChart3 />, section: "Insights" },
          { to: "/admin/users", label: "Users", icon: <Users />, section: "Administration" },
          { to: "/admin/payments", label: "Payments", icon: <CreditCard />, section: "Administration" },
          { to: "/admin/settings", label: "Settings", icon: <Settings />, section: "Administration" },
        ]}
      >
        <Outlet />
      </PortalShell>
    </RequireAuth>
  );
}
