import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { LayoutDashboard, Activity, Users, Warehouse, Truck, CreditCard, BarChart3, Bell, Settings, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Command Center — ShipLync" }, { name: "description", content: "Nationwide logistics command center with fleet, hubs, revenue and AI insights." }] }),
  notFoundComponent: () => <ComingSoon title="Admin module — coming soon" back="/admin" />,
  component: () => (
    <PortalShell
      portal="Admin"
      accent="oklch(0.52 0.19 258)"
      nav={[
        { to: "/admin", label: "Command center", icon: <LayoutDashboard /> },
        { to: "/admin/map", label: "Shipment Monitoring", icon: <Activity /> },
        { to: "/admin/users", label: "Users", icon: <Users /> },
        { to: "/admin/hubs", label: "Hubs", icon: <Warehouse /> },
        { to: "/admin/fleet", label: "Vehicles", icon: <Truck /> },
        { to: "/admin/payments", label: "Payments", icon: <CreditCard /> },
        { to: "/admin/reports", label: "Reports", icon: <BarChart3 /> },
        { to: "/admin/exceptions", label: "Exceptions", icon: <ShieldAlert />, badge: "12" },
        { to: "/admin/notifications", label: "Notifications", icon: <Bell /> },
        { to: "/admin/settings", label: "Settings", icon: <Settings /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
