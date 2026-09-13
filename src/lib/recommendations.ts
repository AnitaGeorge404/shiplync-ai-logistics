// Rule-based shipment recommendations. Deliberately not claimed as "AI" —
// this is a small, explainable rule engine over the actual shipment inputs.
// getShipmentRecommendations() is the single seam to swap in a real
// ML/LLM-backed recommender later without changing any caller.

export type RecommendationInput = {
  packageType: string;
  priority: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  distanceKm: number;
  estimatedHours: number;
};

export type Recommendation = { title: string; detail: string };

const BULKY_DIMENSION_CM = 100;
const HEAVY_WEIGHT_KG = 20;
const LONG_DISTANCE_KM = 800;
const SLOW_ETA_HOURS = 48;

export function getShipmentRecommendations(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = [];

  if (input.packageType === "fragile") {
    recs.push({
      title: "Fragile handling recommended",
      detail: "This package is flagged fragile — it will be routed through padded-handling bays and excluded from automated conveyor sorting.",
    });
  }

  if (input.weightKg >= HEAVY_WEIGHT_KG) {
    recs.push({
      title: "Heavy package — consider a courier/freight service",
      detail: `At ${input.weightKg} kg, this exceeds typical parcel handling limits. A dedicated pickup or freight service may be more reliable than standard parcel routing.`,
    });
  }

  const maxDim = Math.max(input.lengthCm ?? 0, input.widthCm ?? 0, input.heightCm ?? 0);
  if (maxDim >= BULKY_DIMENSION_CM) {
    recs.push({
      title: "Bulky item — oversize handling applies",
      detail: `One or more dimensions exceed ${BULKY_DIMENSION_CM} cm. This shipment will be routed as an oversize item, which may require a larger vehicle at pickup.`,
    });
  }

  if (input.distanceKm >= LONG_DISTANCE_KM && input.priority === "normal") {
    recs.push({
      title: "Long-distance route — express available",
      detail: `This is a ${Math.round(input.distanceKm)} km route. Switching to Express priority would use a faster network tier and meaningfully reduce transit time.`,
    });
  }

  if (input.estimatedHours >= SLOW_ETA_HOURS && input.priority !== "critical") {
    recs.push({
      title: "Estimated delivery is over 2 days",
      detail: "For time-sensitive shipments on this route, consider Express or Medical/Critical priority to reduce the estimated delivery window.",
    });
  }

  if (input.packageType === "medical") {
    recs.push({
      title: "Medical priority lane active",
      detail: "This shipment is automatically routed through the dedicated medical/critical lane with the shortest available hub path.",
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: "Standard routing",
      detail: "No special handling is required for this shipment — it will move through the standard parcel network.",
    });
  }

  return recs;
}
