// Shared helpers for the Delivery Partner portal — real shipment_status /
// priority enums from src/db/schema.ts, not the narrower mock ShipmentStatus
// union the customer/hub/admin screens were built against.

export type RealShipment = {
  id: string;
  trackingId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddressLine: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  receiverFloorCount: number;
  receiverHasSecurityCheckpoint: boolean;
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  packageType: "standard" | "fragile" | "medical" | "express";
  priority: "normal" | "high" | "critical";
  elderlyCare: boolean;
  cost: number;
  status: string;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  distanceKm: number | null;
  [key: string]: unknown;
};

export const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  payment_completed: "Payment done",
  picked_up: "Picked up",
  arrived_hub: "At hub",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivery_attempted: "Attempted — needs follow-up",
  delivered: "Delivered",
  returned: "Returned to sender",
  cancelled: "Cancelled",
};

export type StatusTone = "neutral" | "info" | "warning" | "danger" | "success";

export const STATUS_TONE: Record<string, StatusTone> = {
  booked: "neutral",
  payment_completed: "neutral",
  picked_up: "info",
  arrived_hub: "info",
  in_transit: "info",
  out_for_delivery: "warning",
  delivery_attempted: "danger",
  delivered: "success",
  returned: "neutral",
  cancelled: "neutral",
};

export const TERMINAL_STATUSES = new Set(["delivered", "returned", "cancelled"]);

// Mirrors ALLOWED_TRANSITIONS in src/lib/api-router.ts for the subset a
// delivery agent can actually trigger — used to render the one correct
// "next step" action instead of every technically-allowed transition.
export const NEXT_STATUS: Record<string, { label: string; status: string } | null> = {
  booked: { label: "Mark picked up", status: "picked_up" },
  payment_completed: { label: "Mark picked up", status: "picked_up" },
  picked_up: { label: "Mark out for delivery", status: "out_for_delivery" },
  arrived_hub: { label: "Mark out for delivery", status: "out_for_delivery" },
  in_transit: { label: "Mark out for delivery", status: "out_for_delivery" },
  out_for_delivery: null,
  delivery_attempted: null,
  delivered: null,
  returned: null,
  cancelled: null,
};

// A driver can only log a delivery attempt (success or failure) once a
// shipment is actually out for delivery — matches the server-side check in
// POST /api/shipments/:id/attempts.
export function canRecordAttempt(status: string) {
  return status === "out_for_delivery" || status === "delivery_attempted";
}

export type PriorityTier = "critical" | "priority" | null;

export function priorityTier(
  s: Pick<RealShipment, "priority" | "packageType" | "elderlyCare">,
): PriorityTier {
  if (s.priority === "critical" || s.packageType === "medical" || s.elderlyCare) return "critical";
  if (s.priority === "high") return "priority";
  return null;
}

export function isPending(s: Pick<RealShipment, "status">) {
  return !TERMINAL_STATUSES.has(s.status);
}

export function overviewCounts(shipments: RealShipment[]) {
  const assigned = shipments.length;
  const completed = shipments.filter((s) => s.status === "delivered").length;
  const failed = shipments.filter((s) => s.status === "delivery_attempted").length;
  const pending = shipments.filter((s) => isPending(s) && s.status !== "delivery_attempted").length;
  const priority = shipments.filter((s) => priorityTier(s) !== null && isPending(s)).length;
  return { assigned, pending, completed, failed, priority };
}

// Deterministic, explainable stop sequencing — critical/priority shipments
// first, then soonest ETA. Not a live-traffic route optimizer; described
// plainly in the UI rather than dressed up as "AI".
export function sortByPriorityAndEta(shipments: RealShipment[]) {
  const rank: Record<string, number> = { critical: 0, priority: 1 };
  return [...shipments].sort((a, b) => {
    const ra = rank[priorityTier(a) ?? ""] ?? 2;
    const rb = rank[priorityTier(b) ?? ""] ?? 2;
    if (ra !== rb) return ra - rb;
    const ea = a.estimatedDeliveryAt ? new Date(a.estimatedDeliveryAt).getTime() : Infinity;
    const eb = b.estimatedDeliveryAt ? new Date(b.estimatedDeliveryAt).getTime() : Infinity;
    return ea - eb;
  });
}

export function formatEta(s: Pick<RealShipment, "status" | "deliveredAt" | "estimatedDeliveryAt">) {
  if (s.status === "delivered" && s.deliveredAt) {
    return `Delivered ${new Date(s.deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (s.status === "returned") return "Returned";
  if (!s.estimatedDeliveryAt) return "ETA TBD";
  return `ETA ${new Date(s.estimatedDeliveryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function fullAddress(
  s: Pick<
    RealShipment,
    "receiverAddressLine" | "receiverCity" | "receiverState" | "receiverPincode"
  >,
) {
  return `${s.receiverAddressLine}, ${s.receiverCity}, ${s.receiverState} ${s.receiverPincode}`;
}

export function mapsHref(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export const FAILED_ATTEMPT_REASONS: { value: string; label: string }[] = [
  { value: "receiver_unavailable", label: "Recipient unavailable" },
  { value: "address_issue", label: "Address not found / inaccessible" },
  { value: "refused", label: "Refused by recipient" },
];

export const ATTEMPT_OUTCOME_LABEL: Record<string, string> = {
  delivered: "Delivered",
  receiver_unavailable: "Recipient unavailable",
  address_issue: "Address issue",
  refused: "Refused by recipient",
  rescheduled: "Rescheduled",
  returned: "Returned to sender",
};
