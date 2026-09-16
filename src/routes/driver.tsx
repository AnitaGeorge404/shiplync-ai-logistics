import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DriverShell } from "@/components/shiplync/driver/DriverShell";
import { RequireAuth } from "@/components/shiplync/RequireAuth";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { useShipments, useExceptions } from "@/lib/api-hooks";
import { overviewCounts, type RealShipment } from "@/lib/driver";
import {
  Home,
  Route as RouteIcon,
  ListChecks,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "Driver Portal — ShipLync" },
      {
        name: "description",
        content:
          "Today's deliveries, route sequence, proof of delivery and exceptions for delivery partners.",
      },
    ],
  }),
  notFoundComponent: () => <ComingSoon title="Driver module — coming soon" back="/driver" />,
  component: DriverLayout,
});

function DriverLayout() {
  return (
    <RequireAuth roles={["delivery_agent"]}>
      <DriverNav />
    </RequireAuth>
  );
}

function DriverNav() {
  const { data: assigned = [] } = useShipments("assigned") as { data: RealShipment[] };
  const { data: exceptionLogs = [] } = useExceptions("mine");
  const counts = overviewCounts(assigned);

  return (
    <DriverShell
      nav={[
        { to: "/driver", label: "Today", icon: <Home />, primary: true },
        {
          to: "/driver/my-route",
          label: "Route",
          icon: <RouteIcon />,
          badge: counts.pending,
          primary: true,
        },
        { to: "/driver/deliveries", label: "Deliveries", icon: <ListChecks />, primary: true },
        {
          to: "/driver/exceptions",
          label: "Exceptions",
          icon: <AlertTriangle />,
          badge: exceptionLogs.length,
          primary: true,
        },
        { to: "/driver/earnings", label: "Earnings", icon: <Wallet />, primary: true },
        { to: "/driver/performance", label: "Performance", icon: <TrendingUp /> },
      ]}
    >
      <Outlet />
    </DriverShell>
  );
}
