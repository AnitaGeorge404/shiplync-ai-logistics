import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { RequireAuth } from "@/components/shiplync/RequireAuth";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { useShipments, useExceptions } from "@/lib/api-hooks";
import { Home, ScanLine, Truck, ArrowLeftRight, Warehouse, AlertTriangle, HeartPulse, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/hub")({
  head: () => ({ meta: [{ title: "Hub Ops — ShipLync" }, { name: "description", content: "Shipment intake, scanning, dispatch and exceptions for ShipLync hub staff." }] }),
  notFoundComponent: () => <ComingSoon title="Hub module — coming soon" back="/hub" />,
  component: HubLayout,
});

const DISPATCHABLE = ["arrived_hub", "picked_up", "in_transit"];

function HubLayout() {
  const { data: hubShipments = [] } = useShipments("hub");
  const { data: exceptions = [] } = useExceptions();
  const { data: transfers = [] } = useShipments("hub_transfers");

  const dispatchReady = hubShipments.filter((s: any) => DISPATCHABLE.includes(s.status) && !s.destinationHubId).length;
  const priorityCount = hubShipments.filter(
    (s: any) => s.status !== "delivered" && s.status !== "cancelled" && (s.packageType === "medical" || s.priority === "critical"),
  ).length;

  return (
    <RequireAuth roles={["hub_staff"]}>
      <PortalShell
        portal="Hub Ops"
        nav={[
          { to: "/hub", label: "Control room", icon: <Home /> },
          { to: "/hub/intake", label: "Intake & scan", icon: <ScanLine /> },
          { to: "/hub/dispatch", label: "Dispatch center", icon: <Truck />, badge: dispatchReady > 0 ? String(dispatchReady) : undefined },
          { to: "/hub/transfers", label: "Transfers", icon: <ArrowLeftRight />, badge: transfers.length > 0 ? String(transfers.length) : undefined },
          { to: "/hub/load", label: "Hub capacity", icon: <Warehouse /> },
          { to: "/hub/exceptions", label: "Exceptions", icon: <AlertTriangle />, badge: exceptions.length > 0 ? String(exceptions.length) : undefined },
          { to: "/hub/medical", label: "Priority queue", icon: <HeartPulse />, badge: priorityCount > 0 ? String(priorityCount) : undefined },
          { to: "/hub/analytics", label: "Analytics", icon: <BarChart3 /> },
        ]}
      >
        <Outlet />
      </PortalShell>
    </RequireAuth>
  );
}
