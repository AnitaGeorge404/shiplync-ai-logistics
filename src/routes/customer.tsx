import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/shiplync/PortalShell";
import { ComingSoon } from "@/components/shiplync/ComingSoon";
import { Home, PackagePlus, MapPin, History, MapPinned, CreditCard, FileText, Bell, LifeBuoy, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/customer")({
  head: () => ({
    meta: [
      { title: "Customer Portal — ShipLync" },
      { name: "description", content: "Book shipments, track parcels in real time and manage your ShipLync deliveries." },
      { property: "og:title", content: "ShipLync — Customer Portal" },
      { property: "og:description", content: "Real-time shipment tracking and one-tap booking." },
    ],
  }),
  notFoundComponent: () => <ComingSoon title="Customer module — coming soon" back="/customer" />,
  component: () => (
    <PortalShell
      portal="Customer"
      accent="linear-gradient(135deg, oklch(0.52 0.19 258), oklch(0.66 0.14 235))"
      nav={[
        { to: "/customer", label: "Dashboard", icon: <Home /> },
        { to: "/customer/book", label: "Book shipment", icon: <PackagePlus />, badge: "New" },
        { to: "/customer/track", label: "Track shipment", icon: <MapPin /> },
        { to: "/customer/shipments", label: "History", icon: <History /> },
        { to: "/customer/addresses", label: "Saved addresses", icon: <MapPinned /> },
        { to: "/customer/payments", label: "Payments", icon: <CreditCard /> },
        { to: "/customer/invoices", label: "Invoices", icon: <FileText /> },
        { to: "/customer/returns", label: "Returns", icon: <RotateCcw /> },
        { to: "/customer/notifications", label: "Notifications", icon: <Bell />, badge: "3" },
        { to: "/customer/support", label: "Support", icon: <LifeBuoy /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
