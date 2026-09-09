import { useQuery, useQueryClient } from "@tanstack/react-query";

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

export { useQueryClient };
