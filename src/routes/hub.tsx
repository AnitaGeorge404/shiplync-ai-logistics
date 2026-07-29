import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { Home, ScanLine, Truck, Warehouse, AlertTriangle, HeartPulse, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/hub")({
  head: () => ({ meta: [{ title: "Hub Ops — ShipLync" }, { name: "description", content: "Shipment intake, scanning, dispatch and exceptions for ShipLync hub staff." }] }),
  notFoundComponent: () => <ComingSoon title="Hub module — coming soon" back="/hub" />,
  component: () => (
    <PortalShell
      portal="Hub Ops"
      accent="linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.24 15))"
      nav={[
        { to: "/hub", label: "Control room", icon: <Home /> },
        { to: "/hub/intake", label: "Intake & scan", icon: <ScanLine /> },
        { to: "/hub/dispatch", label: "Dispatch center", icon: <Truck />, badge: "42" },
        { to: "/hub/load", label: "Hub load", icon: <Warehouse /> },
        { to: "/hub/exceptions", label: "Exceptions", icon: <AlertTriangle />, badge: "5" },
        { to: "/hub/medical", label: "Medical queue", icon: <HeartPulse />, badge: "3" },
        { to: "/hub/analytics", label: "Analytics", icon: <BarChart3 /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
