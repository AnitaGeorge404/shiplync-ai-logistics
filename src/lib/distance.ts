// Deterministic distance estimation between two Indian locations.
//
// No live geocoding/maps API is wired up in this iteration, so this uses a
// lookup table of real (approximate) coordinates for major Indian cities,
// falling back to state-centroid coordinates when the city isn't in the
// table, and a fixed default when even the state is unrecognized. This is
// a clean abstraction — swap the body of calculateDistance() for a real
// geocoding call later without touching any caller (pricing, booking form,
// tracking map all only ever call calculateDistance()).

type Coords = { lat: number; lng: number };

// Real (approximate) coordinates for major Indian cities.
const CITY_COORDS: Record<string, Coords> = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  surat: { lat: 21.1702, lng: 72.8311 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  thane: { lat: 19.2183, lng: 72.9781 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  patna: { lat: 25.5941, lng: 85.1376 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  agra: { lat: 27.1767, lng: 78.0081 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kottayam: { lat: 9.5916, lng: 76.5222 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  raipur: { lat: 21.2514, lng: 81.6296 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.391 },
};

// State/UT centroid fallback when the city isn't in the table above.
const STATE_COORDS: Record<string, Coords> = {
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  karnataka: { lat: 15.3173, lng: 75.7139 },
  telangana: { lat: 18.1124, lng: 79.0193 },
  "tamil nadu": { lat: 11.1271, lng: 78.6569 },
  "west bengal": { lat: 22.9868, lng: 87.855 },
  gujarat: { lat: 22.2587, lng: 71.1924 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  "uttar pradesh": { lat: 26.8467, lng: 80.9462 },
  "madhya pradesh": { lat: 22.9734, lng: 78.6569 },
  bihar: { lat: 25.0961, lng: 85.3131 },
  punjab: { lat: 31.1471, lng: 75.3412 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  "andhra pradesh": { lat: 15.9129, lng: 79.74 },
  odisha: { lat: 20.9517, lng: 85.0985 },
  assam: { lat: 26.2006, lng: 92.9376 },
  jharkhand: { lat: 23.6102, lng: 85.2799 },
  chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  haryana: { lat: 29.0588, lng: 76.0856 },
  uttarakhand: { lat: 30.0668, lng: 79.0193 },
};

const DEFAULT_COORDS: Coords = { lat: 22.9734, lng: 78.6569 }; // geographic center of India

function resolveCoords(city: string, state: string): Coords {
  const cityKey = city.trim().toLowerCase();
  if (CITY_COORDS[cityKey]) return CITY_COORDS[cityKey];
  const stateKey = state.trim().toLowerCase();
  if (STATE_COORDS[stateKey]) return STATE_COORDS[stateKey];
  return DEFAULT_COORDS;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine great-circle distance in km, then a fixed road-network
// inflation factor (straight-line distance always understates actual
// road distance) — this is the reusable seam for swapping in a real
// routing/geocoding API later without touching any caller.
export function calculateDistance(
  origin: { city: string; state: string },
  destination: { city: string; state: string },
): number {
  const a = resolveCoords(origin.city, origin.state);
  const b = resolveCoords(destination.city, destination.state);

  const R = 6371; // Earth radius, km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const straightLineKm = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));

  const ROAD_INFLATION_FACTOR = 1.25;
  const distanceKm = straightLineKm * ROAD_INFLATION_FACTOR;

  // Same city, still assign a small real intra-city distance rather than 0.
  return Math.max(distanceKm, straightLineKm === 0 ? 15 : distanceKm);
}
