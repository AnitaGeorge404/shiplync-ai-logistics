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

// Hours from booking to estimated delivery, before hub/transit delays are known.
export function estimateDeliveryHours(input: { priority: string; packageType: string }) {
  if (input.packageType === "medical" || input.priority === "critical") return 6;
  if (input.priority === "high" || input.packageType === "express") return 24;
  return 48;
}

export function generateTrackingId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `SLX${ts}${rand}`;
}
