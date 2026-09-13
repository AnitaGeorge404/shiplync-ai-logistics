// Deterministic shipment pricing + ETA estimation (SRS REQ-2.3 / REQ-3.4).
// Not machine learning — a documented, explainable rule set, which is what
// the SRS actually asks for ("predefined attributes").

const BASE_FARE = 49;
const PER_KG_RATE = 18;
const PACKAGE_TYPE_SURCHARGE: Record<string, number> = {
  standard: 0,
  fragile: 40,
  medical: 0, // medical never pays a premium — it gets priority instead
  express: 90,
};
const PRIORITY_MULTIPLIER: Record<string, number> = {
  normal: 1,
  high: 1.15,
  critical: 1.3,
};
const INSURANCE_RATE = 0.015; // 1.5% of declared value

export function calculateShipmentCost(input: {
  weightKg: number;
  packageType: string;
  priority: string;
  insured: boolean;
  declaredValue?: number | null;
}) {
  const weightCost = Math.max(input.weightKg, 0.5) * PER_KG_RATE;
  const surcharge = PACKAGE_TYPE_SURCHARGE[input.packageType] ?? 0;
  const subtotal = (BASE_FARE + weightCost + surcharge) * (PRIORITY_MULTIPLIER[input.priority] ?? 1);
  const insuranceCost =
    input.insured && input.declaredValue ? input.declaredValue * INSURANCE_RATE : 0;
  return Math.round((subtotal + insuranceCost) * 100) / 100;
}

// Hours from booking to estimated delivery — a real function of distance,
// package type, and priority, not a fixed bucket. Distance comes from
// src/lib/distance.ts's calculateDistance() (haversine + road inflation
// over a real Indian city/state coordinate table) — swap that function's
// internals for a real geocoding/routing API later without touching this.
//
//   estimatedHours = hubProcessingHours(packageType, priority)
//                   + distanceKm / effectiveSpeedKmh(priority)
//                   + handlingAdjustmentHours(packageType)
//   then floored to a minimum realistic transit time per priority tier
//   (couriers don't deliver in 90 minutes just because two cities are close).
const HUB_PROCESSING_HOURS: Record<string, number> = {
  critical: 1,
  high: 2,
  normal: 4,
};
// km/h a shipment effectively moves through the network at, including all
// hub stops — critical/high priority get a faster (air-assisted) network.
const EFFECTIVE_SPEED_KMH: Record<string, number> = {
  critical: 250,
  high: 60,
  normal: 35,
};
const HANDLING_ADJUSTMENT_HOURS: Record<string, number> = {
  standard: 0,
  express: 0,
  medical: 0,
  fragile: 3, // extra careful packing/unpacking time at each hub
};
const MIN_HOURS_BY_PRIORITY: Record<string, number> = {
  critical: 4,
  high: 12,
  normal: 20,
};

export function estimateDeliveryHours(input: {
  priority: string;
  packageType: string;
  distanceKm: number;
}) {
  const priorityKey = input.priority in EFFECTIVE_SPEED_KMH ? input.priority : "normal";
  const hubHours = HUB_PROCESSING_HOURS[priorityKey];
  const speedKmh = EFFECTIVE_SPEED_KMH[priorityKey];
  const handlingHours = HANDLING_ADJUSTMENT_HOURS[input.packageType] ?? 0;
  const minHours = MIN_HOURS_BY_PRIORITY[priorityKey];

  const transitHours = Math.max(input.distanceKm, 0) / speedKmh;
  const totalHours = hubHours + transitHours + handlingHours;

  return Math.round(Math.max(totalHours, minHours) * 10) / 10;
}

export function generateTrackingId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `SLX${ts}${rand}`;
}
