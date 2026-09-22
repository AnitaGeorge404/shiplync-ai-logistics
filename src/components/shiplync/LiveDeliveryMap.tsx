import React, { useEffect, useRef, useState } from "react";
import {
  Bike,
  Home,
  Navigation,
  Phone,
  Radio,
  Clock,
  ShieldCheck,
  Maximize2,
  MapPin,
  Compass,
  KeyRound,
  RotateCw,
  CheckCircle2,
  PackageCheck,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Coords = { lat: number; lng: number };

export type PartnerInfo = {
  name: string;
  phone?: string | null;
  role?: string;
  vehicle?: {
    registrationNumber: string;
    type: string;
  } | null;
};

export type LiveDriverLocation = {
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  updatedAt?: string;
};

interface LiveDeliveryMapProps {
  destinationCoords: Coords;
  destinationAddress?: string;
  driverLocation?: LiveDriverLocation | null;
  originCoords?: Coords | null;
  partner?: PartnerInfo | null;
  status: string;
  deliveryOtp?: string;
  className?: string;
  onRefresh?: () => void;
}

export function LiveDeliveryMap({
  destinationCoords,
  destinationAddress,
  driverLocation,
  originCoords,
  partner,
  status,
  deliveryOtp,
  className,
  onRefresh,
}: LiveDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);
  const [lastSeenSeconds, setLastSeenSeconds] = useState(0);
  const [viewMode, setViewMode] = useState<"fit" | "rider" | "dest">("fit");
  const [tileStyle, setTileStyle] = useState<"osm" | "voyager" | "satellite">("osm");
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
  const currentTileLayerRef = useRef<any>(null);

  const isDelivered = status === "delivered";
  const hasLiveRider = !isDelivered && !!driverLocation;
  const isDelivering = status === "out_for_delivery" || status === "picked_up" || hasLiveRider;
  const isBooked = (status === "booked" || status === "payment_completed") && !hasLiveRider;
  const isTransit = (status === "in_transit" || status === "arrived_hub") && !hasLiveRider;

  // Counter for "updated X seconds ago"
  useEffect(() => {
    setLastSeenSeconds(0);
    const interval = setInterval(() => {
      setLastSeenSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [driverLocation?.lat, driverLocation?.lng, driverLocation?.updatedAt]);

  // Compute effective distinct origin coordinate if origin and dest are essentially the same
  const effectiveOrigin = React.useMemo(() => {
    if (!originCoords) {
      return { lat: destinationCoords.lat + 0.014, lng: destinationCoords.lng - 0.014 };
    }
    const dLat = Math.abs(originCoords.lat - destinationCoords.lat);
    const dLng = Math.abs(originCoords.lng - destinationCoords.lng);
    if (dLat < 0.006 && dLng < 0.006) {
      return { lat: destinationCoords.lat + 0.014, lng: destinationCoords.lng - 0.014 };
    }
    return originCoords;
  }, [originCoords?.lat, originCoords?.lng, destinationCoords.lat, destinationCoords.lng]);

  // Compute effective rider location when active
  const effectiveRiderLoc = React.useMemo(() => {
    if (isDelivered) return null;
    if (driverLocation) return driverLocation;
    if (isDelivering) {
      // Before driver starts GPS / movement, rider is placed right at the origin hub (progress 0.0)
      return {
        lat: effectiveOrigin.lat,
        lng: effectiveOrigin.lng,
        speed: 0,
        heading: 45,
      };
    }
    return null;
  }, [driverLocation, isDelivering, isDelivered, effectiveOrigin]);

  // Initialize Leaflet client-side
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");
      if (isCancelled) return;
      LRef.current = L;

      // Fix default icons path
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const centerLat = destinationCoords.lat;
      const centerLng = destinationCoords.lng;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map tile layer whenever tileStyle changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let layer;
    if (tileStyle === "osm") {
      // Standard OpenStreetMap with complete local landmarks, shops, temples, POIs, building outlines
      layer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
    } else if (tileStyle === "satellite") {
      // High-resolution satellite imagery
      layer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      );
    } else {
      // CartoDB Voyager clean styling
      layer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3n29_1_c31650d1d57db5a97818078e",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );
    }

    layer.addTo(map);
    currentTileLayerRef.current = layer;
  }, [tileStyle, mapReady]);

  // Update markers and route polylines
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapInstanceRef.current;

    // 1. Destination Marker (Customer Delivery Address)
    const destHtml = isDelivered
      ? `
        <div class="relative flex items-center justify-center">
          <div class="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="absolute top-11 whitespace-nowrap bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            Delivered Here
          </div>
        </div>
      `
      : `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-1.5 rounded-full bg-emerald-500/25 animate-ping"></div>
          <div class="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="absolute top-10 whitespace-nowrap bg-background text-foreground text-[10px] font-semibold px-2 py-0.5 rounded shadow border border-border">
            Delivery Address
          </div>
        </div>
      `;

    const destIcon = L.divIcon({
      className: "custom-dest-marker",
      html: destHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker([destinationCoords.lat, destinationCoords.lng], {
        icon: destIcon,
      }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng([destinationCoords.lat, destinationCoords.lng]);
      destMarkerRef.current.setIcon(destIcon);
    }

    // 2. Origin / Source / Hub Marker
    const originTitle = isBooked ? "Source / Pickup" : isTransit ? "Logistics Hub" : "Fulfillment Hub";
    const originIconSvg = isBooked
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><line x1="9" x2="9" y1="21" y2="11"/><line x1="15" x2="15" y1="21" y2="11"/></svg>`;

    const originHtml = `
      <div class="relative flex items-center justify-center">
        <div class="h-8 w-8 rounded-full ${isBooked ? "bg-indigo-600" : "bg-slate-800"} text-white flex items-center justify-center shadow-md border-2 border-white">
          ${originIconSvg}
        </div>
        <div class="absolute top-9 whitespace-nowrap bg-background text-muted-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded shadow border border-border">
          ${originTitle}
        </div>
      </div>
    `;

    const originIcon = L.divIcon({
      className: "custom-dest-marker",
      html: originHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker([effectiveOrigin.lat, effectiveOrigin.lng], {
        icon: originIcon,
      }).addTo(map);
    } else {
      originMarkerRef.current.setLatLng([effectiveOrigin.lat, effectiveOrigin.lng]);
      originMarkerRef.current.setIcon(originIcon);
    }

    // 3. Rider Marker (Delivery Partner Scooter/Bike) — visible during active delivery
    if (effectiveRiderLoc && !isDelivered) {
      const heading = effectiveRiderLoc.heading ?? 45;
      const riderHtml = `
        <div class="relative flex items-center justify-center group pointer-events-auto">
          <!-- Radar ping pulse -->
          <div class="absolute -inset-3 rounded-full bg-primary/20 animate-ping pointer-events-none"></div>
          
          <!-- Top-down Scooter & Driver Illustration with dynamic rotation -->
          <div class="relative w-14 h-14 flex items-center justify-center transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)]" style="transform: rotate(${heading}deg);">
            <img
              src="/scooter-driver.png"
              alt="Delivery Driver"
              class="w-full h-full object-contain pointer-events-none"
            />
          </div>

          <!-- Rider label tag -->
          <div class="absolute -bottom-6 whitespace-nowrap bg-background/95 border border-border text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${partner?.name || "Delivery Partner"}</span>
          </div>
        </div>
      `;

      const riderIcon = L.divIcon({
        className: "custom-rider-marker",
        html: riderHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker([effectiveRiderLoc.lat, effectiveRiderLoc.lng], {
          icon: riderIcon,
        }).addTo(map);
      } else {
        riderMarkerRef.current.setLatLng([effectiveRiderLoc.lat, effectiveRiderLoc.lng]);
        riderMarkerRef.current.setIcon(riderIcon);
      }
    } else {
      if (riderMarkerRef.current) {
        map.removeLayer(riderMarkerRef.current);
        riderMarkerRef.current = null;
      }
    }

    // 4. Road Route Polyline (OSRM)
    let isSubscribed = true;
    const startPoint = effectiveRiderLoc ? effectiveRiderLoc : effectiveOrigin;

    async function fetchRoadRoute() {
      const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM failed");
        const data = await res.json();

        if (isSubscribed && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const distKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMins = Math.max(2, Math.round(route.duration / 60));

          setRouteInfo({ distanceKm: distKm, durationMinutes: durationMins });

          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(coords);
            routeLineRef.current.setStyle({
              color: isDelivered ? "#10b981" : "#2563eb",
            });
          } else {
            routeLineRef.current = L.polyline(coords, {
              color: isDelivered ? "#10b981" : "#2563eb",
              weight: 5,
              opacity: 0.9,
              lineJoin: "round",
              lineCap: "round",
            }).addTo(map);
          }
        }
      } catch (err) {
        // Fallback straight-line polyline if OSRM is unreachable
        if (isSubscribed) {
          const fallbackPoints: [number, number][] = [
            [startPoint.lat, startPoint.lng],
            [destinationCoords.lat, destinationCoords.lng],
          ];
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(fallbackPoints);
          } else {
            routeLineRef.current = L.polyline(fallbackPoints, {
              color: isDelivered ? "#10b981" : "#2563eb",
              weight: 4,
              opacity: 0.8,
              dashArray: "8, 6",
            }).addTo(map);
          }
        }
      }
    }

    fetchRoadRoute();

    // Auto-fit bounds on initial load with generous top padding so banner doesn't obstruct route
    if (viewMode === "fit") {
      const bounds = L.latLngBounds([
        [destinationCoords.lat, destinationCoords.lng],
        [startPoint.lat, startPoint.lng],
      ]);
      map.fitBounds(bounds, {
        paddingTopLeft: [70, 160], // Extra top padding to ensure rider/hub is never hidden under the top-left status banner
        paddingBottomRight: [70, 70],
        maxZoom: 16,
      });
    }

    return () => {
      isSubscribed = false;
    };
  }, [
    mapReady,
    effectiveRiderLoc?.lat,
    effectiveRiderLoc?.lng,
    effectiveRiderLoc?.heading,
    effectiveOrigin.lat,
    effectiveOrigin.lng,
    destinationCoords.lat,
    destinationCoords.lng,
    isDelivered,
    isDelivering,
  ]);

  // Camera focus controls
  function handleFit() {
    if (!mapInstanceRef.current || !LRef.current) return;
    setViewMode("fit");
    const L = LRef.current;
    const startPoint = effectiveRiderLoc ? effectiveRiderLoc : effectiveOrigin;
    const bounds = L.latLngBounds([
      [destinationCoords.lat, destinationCoords.lng],
      [startPoint.lat, startPoint.lng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, {
      paddingTopLeft: [70, 160],
      paddingBottomRight: [70, 70],
      maxZoom: 16,
    });
  }

  function handleFocusRider() {
    if (!mapInstanceRef.current || !effectiveRiderLoc) return;
    setViewMode("rider");
    mapInstanceRef.current.flyTo([effectiveRiderLoc.lat, effectiveRiderLoc.lng], 16, { duration: 1 });
  }

  function handleFocusDest() {
    if (!mapInstanceRef.current) return;
    setViewMode("dest");
    mapInstanceRef.current.flyTo([destinationCoords.lat, destinationCoords.lng], 16, { duration: 1 });
  }

  // Check if driver has reached destination (< 80 meters away or speed=0 right at dest)
  const isDriverArrived = React.useMemo(() => {
    if (!effectiveRiderLoc || isDelivered) return false;
    const dLat = Math.abs(effectiveRiderLoc.lat - destinationCoords.lat);
    const dLng = Math.abs(effectiveRiderLoc.lng - destinationCoords.lng);
    return dLat < 0.0009 && dLng < 0.0009;
  }, [effectiveRiderLoc?.lat, effectiveRiderLoc?.lng, destinationCoords.lat, destinationCoords.lng, isDelivered]);

  const displayEta = isDriverArrived
    ? "Arrived"
    : routeInfo
      ? routeInfo.durationMinutes <= 1
        ? "Arriving now"
        : `${routeInfo.durationMinutes} mins`
      : "8-12 mins";
  const displayDist = isDriverArrived
    ? "0 m"
    : routeInfo
      ? `${routeInfo.distanceKm} km`
      : "2.2 km";

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-card shadow-lg ${className ?? "h-96 sm:h-[450px]"}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-muted/20" />

      {/* Floating Status Banner */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-sm pointer-events-none">
        <div className="bg-background/95 backdrop-blur-md border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-lg pointer-events-auto space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isDelivered ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Delivered Successfully
                  </span>
                </>
              ) : isDriverArrived ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Reached Your Destination
                  </span>
                </>
              ) : isDelivering ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Live Road Tracking
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {isTransit ? "In Transit" : "Order Confirmed"}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" />
                <span>
                  {isDelivered
                    ? "Completed"
                    : isDriverArrived
                      ? "At doorstep"
                      : isDelivering
                        ? lastSeenSeconds < 5
                          ? "Live now"
                          : `${lastSeenSeconds}s ago`
                        : "On schedule"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerCollapsed((prev) => !prev)}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title={isBannerCollapsed ? "Expand card" : "Minimize card"}
              >
                {isBannerCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {!isBannerCollapsed && (
            <div className="flex items-baseline justify-between gap-3 pt-0.5 animate-in fade-in duration-200">
              <div>
                {isDelivered ? (
                  <>
                    <div className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-6 w-6 shrink-0" />
                      <span>Package Delivered</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Delivered to {destinationAddress || "recipient address"}
                    </p>
                  </>
                ) : isDriverArrived ? (
                  <>
                    <div className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-6 w-6 shrink-0" />
                      <span>Reached your destination</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {partner?.name ? `${partner.name} has arrived at your address` : "Delivery partner has arrived at your address"}
                    </p>
                  </>
                ) : isDelivering ? (
                  <>
                    <div className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                      <span>{displayEta}</span>
                      <span className="text-xs font-normal text-muted-foreground">{displayEta === "Arriving now" ? "" : "away"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {partner?.name ? `${partner.name} is on the way` : "Delivery partner on route"} · {displayDist}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-foreground">
                      {isTransit ? "In Transit to Hub" : "Order Placed"}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {isTransit ? "Dispatched on logistics corridor" : "Preparing package for pickup"} · {displayDist}
                    </p>
                  </>
                )}
              </div>

              {deliveryOtp && (
                <div className="text-right shrink-0 bg-primary/10 border border-primary/25 rounded-lg px-2.5 py-1">
                  <div className="text-[9px] uppercase font-semibold text-primary">
                    {isDelivered ? "OTP Status" : "Delivery OTP"}
                  </div>
                  <div className="font-mono text-base font-bold tracking-widest text-primary">
                    {isDelivered ? "VERIFIED" : deliveryOtp}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Layer Switcher: Landmarks vs Clean vs Satellite */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-0.5 bg-background/95 backdrop-blur-md border border-border/80 rounded-xl p-1 shadow-md pointer-events-auto text-xs">
        <button
          type="button"
          onClick={() => setTileStyle("osm")}
          className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
            tileStyle === "osm"
              ? "bg-primary text-primary-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="OpenStreetMap: full local landmarks, shops, places of worship, hospitals, building outlines"
        >
          <MapPin className="h-3 w-3" />
          <span>Landmarks</span>
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("voyager")}
          className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
            tileStyle === "voyager"
              ? "bg-primary text-primary-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Clean courier cartography"
        >
          <Compass className="h-3 w-3" />
          <span className="hidden sm:inline">Clean</span>
        </button>
        <button
          type="button"
          onClick={() => setTileStyle("satellite")}
          className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
            tileStyle === "satellite"
              ? "bg-primary text-primary-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Aerial satellite view"
        >
          <Radio className="h-3 w-3" />
          <span className="hidden sm:inline">Satellite</span>
        </button>
      </div>

      {/* Camera / Navigation Controls */}
      <div className="absolute right-3 bottom-20 sm:bottom-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border hover:bg-background"
          title="Fit Route"
          onClick={handleFit}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        {effectiveRiderLoc && !isDelivered && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border hover:bg-background text-primary"
            title="Focus on Rider"
            onClick={handleFocusRider}
          >
            <Bike className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border hover:bg-background text-emerald-600"
          title="Focus on Delivery Destination"
          onClick={handleFocusDest}
        >
          <Home className="h-4 w-4" />
        </Button>
        {onRefresh && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border hover:bg-background text-muted-foreground"
            title="Refresh Location"
            onClick={onRefresh}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Bottom Partner / Fulfillment Summary Bar */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 pointer-events-auto">
        <div className="bg-background/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
              isDelivered ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/25" : "bg-primary/15 text-primary border-primary/20"
            }`}>
              {isDelivered ? <PackageCheck className="h-5 w-5" /> : <Bike className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-foreground truncate">
                  {partner?.name
                    ? isDelivered
                      ? `Delivered by ${partner.name}`
                      : partner.name
                    : isDelivered
                      ? "Delivery Completed"
                      : "ShipLync Delivery Partner"}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded px-1 py-0.2 font-medium">
                  <ShieldCheck className="h-2.5 w-2.5" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {partner?.vehicle
                  ? `${partner.vehicle.registrationNumber} (${partner.vehicle.type.replace(/_/g, " ")})`
                  : isDelivered
                    ? "Drop-off verified via customer OTP"
                    : "Eco delivery fleet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {partner?.phone && !isDelivered && (
              <a
                href={`tel:${partner.phone.replace(/\s+/g, "")}`}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              >
                <Phone className="h-3 w-3" /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
