// Accurate, deterministic distance estimation and live road-network routing between Indian locations.

export type LocationPoint = {
  city: string;
  state: string;
  pincode?: string;
  addressLine?: string;
};

type Coords = { lat: number; lng: number };

// Accurate coordinates for Indian cities, towns, and localities
const CITY_COORDS: Record<string, Coords> = {
  // Kerala towns & localities
  chethipuzha: { lat: 9.4678, lng: 76.5412 },
  changanassery: { lat: 9.4452, lng: 76.5418 },
  changanacherry: { lat: 9.4452, lng: 76.5418 },
  kottayam: { lat: 9.5916, lng: 76.5222 },
  pala: { lat: 9.7121, lng: 76.6836 },
  ettumanoor: { lat: 9.6698, lng: 76.5623 },
  kanjirappally: { lat: 9.5583, lng: 76.7864 },
  thiruvalla: { lat: 9.3835, lng: 76.5741 },
  kudakkachira: { lat: 9.7505, lng: 76.6219 },
  marangattupally: { lat: 9.7342, lng: 76.6128 },
  valavoor: { lat: 9.7412, lng: 76.6341 },
  alappuzha: { lat: 9.4981, lng: 76.3388 },
  alleppey: { lat: 9.4981, lng: 76.3388 },
  cherthala: { lat: 9.6844, lng: 76.3338 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  ernakulam: { lat: 9.9816, lng: 76.2999 },
  kakkanad: { lat: 10.0159, lng: 76.3419 },
  aluva: { lat: 10.1076, lng: 76.3516 },
  angamaly: { lat: 10.196, lng: 76.386 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  palakkad: { lat: 10.7867, lng: 76.6548 },
  malappuram: { lat: 11.051, lng: 76.0711 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  kannur: { lat: 11.8745, lng: 75.3704 },
  kasaragod: { lat: 12.4996, lng: 74.9869 },
  wayanad: { lat: 11.6103, lng: 76.0827 },
  kalpetta: { lat: 11.6103, lng: 76.0827 },
  kollam: { lat: 8.8932, lng: 76.6141 },
  quilon: { lat: 8.8932, lng: 76.6141 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  pathanamthitta: { lat: 9.2648, lng: 76.787 },
  adoor: { lat: 9.153, lng: 76.7356 },
  idukki: { lat: 9.8494, lng: 76.9804 },
  thodupuzha: { lat: 9.8959, lng: 76.7184 },

  // Major Indian cities
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

// PIN code specific coordinate map
const PINCODE_COORDS: Record<string, Coords> = {
  "686106": { lat: 9.4802, lng: 76.5516 }, // Changanassery / Chethipuzha
  "686101": { lat: 9.4452, lng: 76.5418 }, // Changanassery Town
  "686635": { lat: 9.7505, lng: 76.6219 }, // Kudakkachira / Meenachil
  "686001": { lat: 9.5916, lng: 76.5222 }, // Kottayam Head Post Office
  "686002": { lat: 9.5855, lng: 76.5182 }, // Kottayam Collectorate
  "682001": { lat: 9.9654, lng: 76.2418 }, // Kochi / Fort Kochi
  "682030": { lat: 10.0159, lng: 76.3419 }, // Kakkanad InfoPark
  "695001": { lat: 8.5241, lng: 76.9366 }, // Trivandrum GPO
  "560001": { lat: 12.9716, lng: 77.5946 }, // Bangalore GPO
  "560066": { lat: 12.9698, lng: 77.75 }, // Whitefield
  "400001": { lat: 18.9388, lng: 72.8354 }, // Mumbai Fort / CST
  "400069": { lat: 19.1136, lng: 72.8697 }, // Andheri East
  "110001": { lat: 28.6315, lng: 77.2167 }, // Connaught Place, New Delhi
  "600001": { lat: 13.0878, lng: 80.2878 }, // Chennai GPO
  "500001": { lat: 17.385, lng: 78.4867 }, // Hyderabad GPO
};

// 3-digit PIN code district prefix centroids
const PINCODE_PREFIX_COORDS: Record<string, Coords> = {
  "686": { lat: 9.5916, lng: 76.5222 }, // Kottayam district
  "682": { lat: 9.9816, lng: 76.2999 }, // Ernakulam / Kochi
  "680": { lat: 10.5276, lng: 76.2144 }, // Thrissur
  "688": { lat: 9.4981, lng: 76.3388 }, // Alappuzha
  "689": { lat: 9.2648, lng: 76.787 }, // Pathanamthitta
  "691": { lat: 8.8932, lng: 76.6141 }, // Kollam
  "695": { lat: 8.5241, lng: 76.9366 }, // Thiruvananthapuram
  "673": { lat: 11.2588, lng: 75.7804 }, // Kozhikode
  "670": { lat: 11.8745, lng: 75.3704 }, // Kannur
  "671": { lat: 12.4996, lng: 74.9869 }, // Kasaragod
  "678": { lat: 10.7867, lng: 76.6548 }, // Palakkad
  "676": { lat: 11.051, lng: 76.0711 }, // Malappuram
  "679": { lat: 10.7867, lng: 76.2341 }, // Shoranur / Palakkad
  "560": { lat: 12.9716, lng: 77.5946 }, // Bengaluru Urban
  "570": { lat: 12.2958, lng: 76.6394 }, // Mysuru
  "575": { lat: 12.9141, lng: 74.856 }, // Mangaluru
  "400": { lat: 19.076, lng: 72.8777 }, // Mumbai
  "411": { lat: 18.5204, lng: 73.8567 }, // Pune
  "110": { lat: 28.6139, lng: 77.209 }, // Delhi
  "600": { lat: 13.0827, lng: 80.2707 }, // Chennai
  "500": { lat: 17.385, lng: 78.4867 }, // Hyderabad
  "700": { lat: 22.5726, lng: 88.3639 }, // Kolkata
};

// State centroid fallback
const STATE_COORDS: Record<string, Coords> = {
  kerala: { lat: 10.1505, lng: 76.4711 },
  karnataka: { lat: 14.3173, lng: 75.7139 },
  tamilnadu: { lat: 11.1271, lng: 78.6569 },
  "tamil nadu": { lat: 11.1271, lng: 78.6569 },
  maharashtra: { lat: 19.2515, lng: 74.8139 },
  delhi: { lat: 28.6139, lng: 77.209 },
  telangana: { lat: 17.8124, lng: 78.9193 },
  "andhra pradesh": { lat: 15.9129, lng: 79.74 },
  gujarat: { lat: 22.5587, lng: 71.8924 },
  rajasthan: { lat: 26.5238, lng: 74.2179 },
  "uttar pradesh": { lat: 26.8467, lng: 80.9462 },
  "west bengal": { lat: 22.9868, lng: 87.855 },
  punjab: { lat: 31.1471, lng: 75.3412 },
  haryana: { lat: 29.0588, lng: 76.0856 },
  "madhya pradesh": { lat: 23.2734, lng: 77.6569 },
  bihar: { lat: 25.5961, lng: 85.3131 },
  odisha: { lat: 20.9517, lng: 85.0985 },
  assam: { lat: 26.2006, lng: 92.9376 },
  goa: { lat: 15.2993, lng: 74.124 },
};

const DEFAULT_COORDS: Coords = { lat: 20.5937, lng: 78.9629 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function resolveLocationCoords(loc: LocationPoint): Coords {
  const pin = (loc.pincode || "").trim().replace(/\D/g, "");
  if (pin && PINCODE_COORDS[pin]) {
    return PINCODE_COORDS[pin];
  }

  const cityKey = (loc.city || "").trim().toLowerCase();
  if (cityKey && CITY_COORDS[cityKey]) {
    return CITY_COORDS[cityKey];
  }

  if (pin && pin.length >= 3) {
    const p3 = pin.slice(0, 3);
    if (PINCODE_PREFIX_COORDS[p3]) {
      return PINCODE_PREFIX_COORDS[p3];
    }
  }

  const stateKey = (loc.state || "").trim().toLowerCase();
  if (stateKey && STATE_COORDS[stateKey]) {
    return STATE_COORDS[stateKey];
  }

  return DEFAULT_COORDS;
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Calculates realistic road distance (in Km) between two Indian locations.
 * Intelligently handles:
 * - Same address / building: 0.8 Km (local pickup & drop)
 * - Same neighborhood / locality (e.g. Chethipuzha -> Chethipuzha): 2.4 Km
 * - Same city / district with different PIN codes: realistic road distance
 * - Inter-city / inter-state: road network distance with terrain winding factors
 */
export function calculateDistance(
  origin: LocationPoint,
  destination: LocationPoint,
): number {
  const originCity = (origin.city || "").trim().toLowerCase();
  const destCity = (destination.city || "").trim().toLowerCase();
  const originPin = (origin.pincode || "").trim().replace(/\D/g, "");
  const destPin = (destination.pincode || "").trim().replace(/\D/g, "");
  const originAddr = (origin.addressLine || "").trim().toLowerCase();
  const destAddr = (destination.addressLine || "").trim().toLowerCase();

  // 1. Identical addresses
  if (originAddr && destAddr && originAddr === destAddr && originCity === destCity) {
    return 0.8;
  }

  // 2. Same neighborhood / locality
  const isSameCity = originCity && destCity && (originCity === destCity || originCity.includes(destCity) || destCity.includes(originCity));
  const isSamePin = originPin && destPin && originPin === destPin;

  if (isSameCity && isSamePin) {
    // Delivery within the same neighborhood/locality (e.g. Chethipuzha to Chethipuzha)
    return 2.4;
  }

  // 3. Resolve real geographic coordinates
  const a = resolveLocationCoords(origin);
  const b = resolveLocationCoords(destination);
  const straightLine = haversineKm(a, b);

  // If coordinates are essentially the same point
  if (straightLine < 0.5) {
    if (isSameCity) {
      return 2.5; // same town/neighborhood
    }
    return 3.0;
  }

  // 4. Urban vs Highway winding factor
  // Urban / short routes have more cross-streets (~1.35x winding factor).
  // Highway / inter-city routes follow corridors (~1.22x - 1.25x winding factor).
  let roadFactor = 1.25;
  if (straightLine < 15) {
    roadFactor = 1.35;
  } else if (straightLine < 50) {
    roadFactor = 1.28;
  } else {
    roadFactor = 1.22;
  }

  const roadDistance = straightLine * roadFactor;
  return Math.max(1.0, Math.round(roadDistance * 10) / 10);
}

export type RouteDistanceDetails = {
  distanceKm: number;
  directDistanceKm: number;
  routingOverheadKm: number;
  routingOverheadPct: number;
  isLocal: boolean;
};

/**
 * Returns breakdown of road distance vs direct straight-line distance,
 * accounting for local neighborhood delivery routing.
 */
export function getRouteDistanceDetails(
  origin: LocationPoint,
  destination: LocationPoint,
): RouteDistanceDetails {
  const roadDist = calculateDistance(origin, destination);
  const a = resolveLocationCoords(origin);
  const b = resolveLocationCoords(destination);
  const straight = haversineKm(a, b);

  // For same coordinates / neighborhood, direct distance is ~75% of neighborhood road distance
  const directDist =
    straight < 0.5
      ? Math.max(0.5, Math.round((roadDist / 1.33) * 10) / 10)
      : Math.max(0.5, Math.round(straight * 10) / 10);

  const overheadKm = Math.max(0, Math.round((roadDist - directDist) * 10) / 10);
  const overheadPct = roadDist > 0 ? Math.round((overheadKm / roadDist) * 100) : 0;

  return {
    distanceKm: roadDist,
    directDistanceKm: directDist,
    routingOverheadKm: overheadKm,
    routingOverheadPct: overheadPct,
    isLocal: roadDist <= 30,
  };
}

// In-memory cache for live OSRM queries
const osrmCache = new Map<string, { distanceKm: number; durationMinutes: number }>();

/**
 * Optional async helper to fetch real-world road network driving distance from OSRM
 * with fallback to calculateDistance.
 */
export async function fetchLiveRoadDistance(
  origin: LocationPoint,
  destination: LocationPoint,
): Promise<{ distanceKm: number; directDistanceKm: number; durationMinutes: number; isLive: boolean }> {
  const originCity = (origin.city || "").trim().toLowerCase();
  const destCity = (destination.city || "").trim().toLowerCase();
  const originPin = (origin.pincode || "").trim().replace(/\D/g, "");
  const destPin = (destination.pincode || "").trim().replace(/\D/g, "");

  // Instant local delivery handling
  if (originCity && destCity && originCity === destCity && (!originPin || !destPin || originPin === destPin)) {
    const dist = 2.4;
    return {
      distanceKm: dist,
      directDistanceKm: 1.8,
      durationMinutes: 15,
      isLive: false,
    };
  }

  const a = resolveLocationCoords(origin);
  const b = resolveLocationCoords(destination);
  const straight = haversineKm(a, b);

  const fallbackDist = calculateDistance(origin, destination);
  const fallbackDirect = Math.max(0.5, Math.round(straight * 10) / 10);
  const fallbackDuration = Math.round((fallbackDist / 35) * 60);

  // If running in browser or node, attempt OSRM query
  const cacheKey = `${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
  if (osrmCache.has(cacheKey)) {
    const cached = osrmCache.get(cacheKey)!;
    return {
      distanceKm: cached.distanceKm,
      directDistanceKm: fallbackDirect,
      durationMinutes: cached.durationMinutes,
      isLive: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const liveDistKm = Math.round((data.routes[0].distance / 1000) * 10) / 10;
        const liveDurationMins = Math.round(data.routes[0].duration / 60);
        osrmCache.set(cacheKey, { distanceKm: liveDistKm, durationMinutes: liveDurationMins });
        return {
          distanceKm: liveDistKm,
          directDistanceKm: fallbackDirect,
          durationMinutes: liveDurationMins,
          isLive: true,
        };
      }
    }
  } catch {
    // Network or timeout, use calculated fallback
  }

  return {
    distanceKm: fallbackDist,
    directDistanceKm: fallbackDirect,
    durationMinutes: fallbackDuration,
    isLive: false,
  };
}
