import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { Home, Route as RouteIcon, ListChecks, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [{ title: "Driver Portal — ShipLync" }, { name: "description", content: "Optimized routes, one-tap POD, OTP verification and earnings for delivery partners." }] }),
  notFoundComponent: () => <ComingSoon title="Driver module — coming soon" back="/driver" />,
  component: () => (
    <PortalShell
      portal="Delivery Partner"
      accent="oklch(0.68 0.16 155)"
      nav={[
        { to: "/driver", label: "Today", icon: <Home /> },
        { to: "/driver/my-route", label: "My route", icon: <RouteIcon />, badge: "6" },
        { to: "/driver/deliveries", label: "Deliveries", icon: <ListChecks /> },
        { to: "/driver/earnings", label: "Earnings", icon: <Wallet /> },
        { to: "/driver/performance", label: "Performance", icon: <TrendingUp /> },
        { to: "/driver/exceptions", label: "Exceptions", icon: <AlertTriangle />, badge: "1" },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
