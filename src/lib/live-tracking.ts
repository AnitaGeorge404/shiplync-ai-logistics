// Real-time in-memory tracking store for delivery partners
// Backs the live Instamart / Blinkit-style tracking experience.

export type DriverLocation = {
  shipmentId: string;
  trackingId?: string;
  agentId?: string;
  lat: number;
  lng: number;
  speed: number | null; // km/h
  heading: number | null; // degrees (0-360)
  accuracy: number | null; // meters
  updatedAt: string; // ISO string
};

// Keyed by shipmentId and trackingId for quick lookup
const locationByShipmentId = new Map<string, DriverLocation>();
const locationByTrackingId = new Map<string, DriverLocation>();

export function updateDriverLocation(loc: Omit<DriverLocation, "updatedAt"> & { updatedAt?: string }): DriverLocation {
  const record: DriverLocation = {
    ...loc,
    updatedAt: loc.updatedAt || new Date().toISOString(),
  };

  if (record.shipmentId) {
    locationByShipmentId.set(record.shipmentId, record);
  }
  if (record.trackingId) {
    locationByTrackingId.set(record.trackingId, record);
  }

  return record;
}

export function getDriverLocation(idOrTracking: string): DriverLocation | null {
  if (locationByShipmentId.has(idOrTracking)) {
    return locationByShipmentId.get(idOrTracking)!;
  }
  if (locationByTrackingId.has(idOrTracking)) {
    return locationByTrackingId.get(idOrTracking)!;
  }
  return null;
}

// Calculate straight-line distance in km between two lat/lng pairs
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generates an initial realistic driver location between origin and destination
// for shipments currently out for delivery or picked up.
export function generateInterpolatedPosition(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  progressPct: number = 0.65
): { lat: number; lng: number; heading: number } {
  const p = Math.max(0, Math.min(1, progressPct));
  // Add a slight realistic curve/jitter
  const lat = origin.lat + (dest.lat - origin.lat) * p + (Math.sin(p * Math.PI) * 0.003);
  const lng = origin.lng + (dest.lng - origin.lng) * p + (Math.cos(p * Math.PI) * 0.003);

  // Calculate heading
  const dLng = dest.lng - lng;
  const dLat = dest.lat - lat;
  let angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  return { lat, lng, heading: Math.round(angle) };
}
