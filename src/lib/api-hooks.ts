import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ShipmentStatus } from "./mock-data";

async function getJson<T>(url: string, fallback: T): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) return fallback;
  return res.json();
}

export function useShipments(scope: "assigned" | "hub" | "unassigned" | "all" | "mine") {
  const query = scope === "mine" ? "" : `?scope=${scope}`;
  return useQuery({
    queryKey: ["shipments", scope],
    queryFn: async () => (await getJson<{ shipments: any[] }>(`/api/shipments${query}`, { shipments: [] })).shipments,
    refetchInterval: 8000,
  });
}

export function useExceptions(scope?: "mine") {
  return useQuery({
    queryKey: ["exceptions", scope ?? "all"],
    queryFn: async () =>
      (
        await getJson<{ exceptions: any[] }>(`/api/exceptions${scope ? `?scope=${scope}` : ""}`, {
          exceptions: [],
        })
      ).exceptions,
    refetchInterval: 15000,
  });
}

export function useHubs() {
  return useQuery({
    queryKey: ["hubs"],
    queryFn: async () => (await getJson<{ hubs: any[] }>("/api/hubs", { hubs: [] })).hubs,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await getJson<{ vehicles: any[] }>("/api/vehicles", { vehicles: [] })).vehicles,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => (await getJson<{ agents: any[] }>("/api/agents", { agents: [] })).agents,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await getJson<{ users: any[] }>("/api/users", { users: [] })).users,
  });
}

export function usePayments(scope?: "all") {
  return useQuery({
    queryKey: ["payments", scope ?? "mine"],
    queryFn: async () =>
      (
        await getJson<{ payments: any[] }>(`/api/payments${scope ? `?scope=${scope}` : ""}`, {
          payments: [],
        })
      ).payments,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await getJson<{ addresses: any[] }>("/api/addresses", { addresses: [] })).addresses,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await getJson<{ notifications: any[] }>("/api/notifications", { notifications: [] })).notifications,
    refetchInterval: 15000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: async () =>
      getJson("/api/stats/overview", {
        total: 0,
        deliveredToday: 0,
        active: 0,
        pending: 0,
        failed: 0,
        medical: 0,
        avgDeliveryHours: 0,
        revenue: 0,
        fleetUtilization: 0,
      }),
    refetchInterval: 15000,
  });
}

// Maps our real shipment_status enum to the narrower status union
// StatusBadge/mock UI was built against, so real data can flow through
// the existing badge component without rewriting it.
const STATUS_BADGE_MAP: Record<string, string> = {
  booked: "booked",
  payment_completed: "booked",
  picked_up: "picked_up",
  arrived_hub: "at_hub",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivery_attempted: "exception",
  delivered: "delivered",
  returned: "exception",
  cancelled: "exception",
};

export function toBadgeStatus(status: string): ShipmentStatus {
  return (STATUS_BADGE_MAP[status] ?? status) as ShipmentStatus;
}

// Rough progress percentage for a real shipment, for progress bars/route
// maps built against the mock data's 0-100 "progress" field.
const STATUS_PROGRESS: Record<string, number> = {
  booked: 5,
  payment_completed: 10,
  picked_up: 25,
  arrived_hub: 40,
  in_transit: 60,
  out_for_delivery: 85,
  delivery_attempted: 90,
  delivered: 100,
  returned: 100,
  cancelled: 0,
};

export function toProgress(status: string): number {
  return STATUS_PROGRESS[status] ?? 0;
}

export { useQueryClient };
