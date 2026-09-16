export interface PincodeLookupResult {
  city: string;
  state: string;
  district: string;
  places: string[];
}

const memoryCache = new Map<string, PincodeLookupResult>();
const inFlightRequests = new Map<string, Promise<PincodeLookupResult | null>>();

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

// Fallback Indian postal circle mapping by 2-digit/3-digit prefix for maximum resilience
const STATE_CIRCLE_PREFIXES: Record<string, { state: string; city?: string }> = {
  "11": { state: "Delhi", city: "New Delhi" },
  "12": { state: "Haryana" },
  "13": { state: "Haryana" },
  "14": { state: "Punjab" },
  "15": { state: "Punjab" },
  "16": { state: "Chandigarh", city: "Chandigarh" },
  "17": { state: "Himachal Pradesh" },
  "18": { state: "Jammu and Kashmir" },
  "19": { state: "Jammu and Kashmir" },
  "20": { state: "Uttar Pradesh" },
  "21": { state: "Uttar Pradesh" },
  "22": { state: "Uttar Pradesh" },
  "23": { state: "Uttar Pradesh" },
  "24": { state: "Uttarakhand" },
  "25": { state: "Uttar Pradesh" },
  "26": { state: "Uttar Pradesh" },
  "27": { state: "Uttar Pradesh" },
  "28": { state: "Uttar Pradesh" },
  "30": { state: "Rajasthan", city: "Jaipur" },
  "31": { state: "Rajasthan" },
  "32": { state: "Rajasthan" },
  "33": { state: "Rajasthan" },
  "34": { state: "Rajasthan" },
  "36": { state: "Gujarat" },
  "37": { state: "Gujarat" },
  "38": { state: "Gujarat", city: "Ahmedabad" },
  "39": { state: "Gujarat" },
  "40": { state: "Maharashtra", city: "Mumbai" },
  "41": { state: "Maharashtra", city: "Pune" },
  "42": { state: "Maharashtra" },
  "43": { state: "Maharashtra" },
  "44": { state: "Maharashtra", city: "Nagpur" },
  "45": { state: "Madhya Pradesh" },
  "46": { state: "Madhya Pradesh", city: "Bhopal" },
  "47": { state: "Madhya Pradesh" },
  "48": { state: "Madhya Pradesh" },
  "49": { state: "Chhattisgarh" },
  "50": { state: "Telangana", city: "Hyderabad" },
  "51": { state: "Andhra Pradesh" },
  "52": { state: "Andhra Pradesh" },
  "53": { state: "Andhra Pradesh", city: "Visakhapatnam" },
  "56": { state: "Karnataka", city: "Bengaluru" },
  "57": { state: "Karnataka" },
  "58": { state: "Karnataka" },
  "59": { state: "Karnataka" },
  "60": { state: "Tamil Nadu", city: "Chennai" },
  "61": { state: "Tamil Nadu" },
  "62": { state: "Tamil Nadu", city: "Madurai" },
  "63": { state: "Tamil Nadu", city: "Coimbatore" },
  "64": { state: "Tamil Nadu" },
  "67": { state: "Kerala", city: "Kozhikode" },
  "68": { state: "Kerala", city: "Kochi" },
  "69": { state: "Kerala", city: "Thiruvananthapuram" },
  "70": { state: "West Bengal", city: "Kolkata" },
  "71": { state: "West Bengal" },
  "72": { state: "West Bengal" },
  "73": { state: "West Bengal" },
  "74": { state: "West Bengal" },
  "75": { state: "Odisha", city: "Bhubaneswar" },
  "76": { state: "Odisha" },
  "77": { state: "Odisha" },
  "78": { state: "Assam", city: "Guwahati" },
  "79": { state: "North Eastern" },
  "80": { state: "Bihar", city: "Patna" },
  "81": { state: "Bihar" },
  "82": { state: "Jharkhand" },
  "83": { state: "Jharkhand", city: "Ranchi" },
  "84": { state: "Bihar" },
  "85": { state: "Bihar" },
};

/**
 * Looks up Indian PIN code details (City / District and State).
 * Primary source: India Post Public API (api.postalpincode.in).
 * Secondary source: internal server proxy /api/pincode/:pincode.
 * Fallback: prefix-based geographic estimation.
 */
export async function lookupPincode(rawPincode: string): Promise<PincodeLookupResult | null> {
  const pin = rawPincode.trim().replace(/\D/g, "");
  if (pin.length !== 6 || !/^[1-9]\d{5}$/.test(pin)) {
    return null;
  }

  if (memoryCache.has(pin)) {
    return memoryCache.get(pin)!;
  }

  if (inFlightRequests.has(pin)) {
    return inFlightRequests.get(pin)!;
  }

  const promise = (async (): Promise<PincodeLookupResult | null> => {
    try {
      // 1. Try public India Post API with 4s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice)) {
          const postOffices = data[0].PostOffice;
          if (postOffices.length > 0) {
            const first = postOffices[0];
            const rawDistrict = (first.District || "").trim();
            const rawBlock = (first.Block || "").trim();
            const rawName = (first.Name || "").trim();
            const rawState = (first.State || "").trim();

            const district = toTitleCase(rawDistrict);
            const state = toTitleCase(rawState);
            const city = district && district !== "Na" ? district : rawBlock && rawBlock !== "Na" ? toTitleCase(rawBlock) : toTitleCase(rawName);

            const places: string[] = Array.from(
              new Set<string>(
                postOffices
                  .map((po: any): string => toTitleCase((po.Name || "").trim()))
                  .filter((s: string) => Boolean(s)),
              ),
            );

            const result: PincodeLookupResult = {
              city,
              state,
              district,
              places,
            };

            memoryCache.set(pin, result);
            return result;
          }
        }
      }

      // 2. Fallback to server proxy if running in browser
      if (typeof window !== "undefined") {
        try {
          const proxyRes = await fetch(`/api/pincode/${pin}`).catch(() => null);
          if (proxyRes && proxyRes.ok) {
            const proxyData = (await proxyRes.json().catch(() => null)) as PincodeLookupResult | null;
            if (proxyData && proxyData.city && proxyData.state) {
              memoryCache.set(pin, proxyData);
              return proxyData;
            }
          }
        } catch {
          // ignore proxy failure and continue to prefix fallback
        }
      }

      // 3. Fallback to postal circle prefix map
      const prefix2 = pin.slice(0, 2);
      const fallback = STATE_CIRCLE_PREFIXES[prefix2];
      if (fallback) {
        const result: PincodeLookupResult = {
          city: fallback.city || "Area " + pin,
          state: fallback.state,
          district: fallback.city || fallback.state,
          places: [],
        };
        memoryCache.set(pin, result);
        return result;
      }

      return null;
    } finally {
      inFlightRequests.delete(pin);
    }
  })();

  inFlightRequests.set(pin, promise);
  return promise;
}
