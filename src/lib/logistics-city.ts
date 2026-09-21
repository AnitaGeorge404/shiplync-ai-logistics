// Demo/product simulation of "which major logistics city is this shipment
// currently near" — NOT real GPS. We don't have live hub telemetry, so when
// hub staff scan a shipment we need a deterministic, presentable
// customer-facing location. Rather than showing the actual (often small,
// single-seeded) configured hub name, we map the shipment's destination to
// the nearest major Indian logistics hub city. Deterministic: same input
// always produces the same output, so repeated scans are stable and this
// is trivially testable.

type MajorCity = {
  city: string;
  state: string;
  /** Lowercase keywords (city/district/locality names) routed to this hub. */
  keywords: string[];
  pincodePrefixes: string[];
};

// Keep this reasonably small and readable — it's a demo mapping, not a
// full postal directory. Add entries here, never inline elsewhere.
const MAJOR_LOGISTICS_CITIES: MajorCity[] = [
  { city: "Kochi", state: "Kerala", keywords: ["kochi", "cochin", "ernakulam", "kottayam", "alappuzha", "alleppey", "thrippunithura", "aluva", "muvattupuzha", "vaikom", "changanassery"], pincodePrefixes: ["682", "686"] },
  { city: "Thiruvananthapuram", state: "Kerala", keywords: ["thiruvananthapuram", "trivandrum", "kollam", "varkala", "neyyattinkara"], pincodePrefixes: ["695", "691"] },
  { city: "Kozhikode", state: "Kerala", keywords: ["kozhikode", "calicut", "malappuram", "wayanad", "kannur", "kasaragod"], pincodePrefixes: ["673", "670", "671", "676"] },
  { city: "Bengaluru", state: "Karnataka", keywords: ["bengaluru", "bangalore", "mysuru", "mysore", "mandya", "tumkur", "tumakuru", "hosur"], pincodePrefixes: ["560", "570", "571", "572"] },
  { city: "Mumbai", state: "Maharashtra", keywords: ["mumbai", "bombay", "thane", "navi mumbai", "kalyan", "vasai", "virar", "panvel"], pincodePrefixes: ["400", "401", "421"] },
  { city: "Pune", state: "Maharashtra", keywords: ["pune", "pimpri", "chinchwad", "lonavala", "satara"], pincodePrefixes: ["411", "412"] },
  { city: "Delhi", state: "Delhi", keywords: ["delhi", "new delhi", "gurugram", "gurgaon", "noida", "ghaziabad", "faridabad"], pincodePrefixes: ["110", "122", "201", "121"] },
  { city: "Jaipur", state: "Rajasthan", keywords: ["jaipur", "ajmer", "alwar", "sikar"], pincodePrefixes: ["302", "303", "305"] },
  { city: "Ahmedabad", state: "Gujarat", keywords: ["ahmedabad", "gandhinagar", "surat", "vadodara", "baroda"], pincodePrefixes: ["380", "382", "390", "395"] },
  { city: "Chennai", state: "Tamil Nadu", keywords: ["chennai", "madras", "kanchipuram", "tambaram", "chengalpattu"], pincodePrefixes: ["600", "601", "602"] },
  { city: "Coimbatore", state: "Tamil Nadu", keywords: ["coimbatore", "erode", "tiruppur", "salem"], pincodePrefixes: ["641", "638", "636"] },
  { city: "Hyderabad", state: "Telangana", keywords: ["hyderabad", "secunderabad", "warangal", "cyberabad"], pincodePrefixes: ["500", "501", "502"] },
  { city: "Kolkata", state: "West Bengal", keywords: ["kolkata", "calcutta", "howrah", "salt lake"], pincodePrefixes: ["700", "711"] },
  { city: "Lucknow", state: "Uttar Pradesh", keywords: ["lucknow", "kanpur", "unnao"], pincodePrefixes: ["226", "208"] },
  { city: "Bhopal", state: "Madhya Pradesh", keywords: ["bhopal", "indore", "ujjain"], pincodePrefixes: ["462", "452"] },
  { city: "Chandigarh", state: "Punjab", keywords: ["chandigarh", "mohali", "panchkula", "ludhiana", "amritsar"], pincodePrefixes: ["160", "140", "141", "143"] },
];

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export type DestinationInfo = {
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

/**
 * Maps a shipment's destination to the nearest major logistics hub city,
 * deterministically. Falls back to the destination city itself (or "Unknown"
 * as an absolute last resort) if nothing matches, so the tracking workflow
 * never breaks on an unrecognized locality.
 */
export function getNearestMajorLogisticsCity(destination: DestinationInfo): string {
  const city = normalize(destination.city);
  const state = normalize(destination.state);
  const pincode = (destination.pincode ?? "").trim();

  for (const entry of MAJOR_LOGISTICS_CITIES) {
    if (entry.keywords.some((kw) => city && (city.includes(kw) || kw.includes(city)))) {
      return entry.city;
    }
  }

  if (pincode) {
    for (const entry of MAJOR_LOGISTICS_CITIES) {
      if (entry.pincodePrefixes.some((prefix) => pincode.startsWith(prefix))) {
        return entry.city;
      }
    }
  }

  if (state) {
    for (const entry of MAJOR_LOGISTICS_CITIES) {
      if (normalize(entry.state) === state) {
        return entry.city;
      }
    }
  }

  return destination.city?.trim() || "Unknown";
}
