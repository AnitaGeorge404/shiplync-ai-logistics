import { useEffect, useState } from "react";
import { MapPin, Navigation, Truck } from "lucide-react";

type Props = {
  from: string;
  to: string;
  progress?: number; // 0-100
  hubs?: { x: number; y: number; label: string }[];
  className?: string;
  compact?: boolean;
};

// Stylized SVG map — purely visual, works on server & client
export function RouteMap({ from, to, progress = 60, hubs, className, compact }: Props) {
  const [p, setP] = useState(progress);
  useEffect(() => {
    const t = setInterval(() => {
      setP((v) => (v >= 99 ? progress : v + 0.15));
    }, 120);
    return () => clearInterval(t);
  }, [progress]);

  const path = "M 40 260 C 160 120, 300 340, 460 200 S 720 80, 860 180";
  // approximate coordinate along cubic path
  const t = Math.min(Math.max(p / 100, 0), 1);
  const points = [
    [40, 260],
    [220, 160],
    [420, 240],
    [620, 140],
    [860, 180],
  ];
  const idx = Math.min(Math.floor(t * (points.length - 1)), points.length - 2);
  const localT = t * (points.length - 1) - idx;
  const cx = points[idx][0] + (points[idx + 1][0] - points[idx][0]) * localT;
  const cy = points[idx][1] + (points[idx + 1][1] - points[idx][1]) * localT;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 ${className ?? ""}`}>
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <svg viewBox="0 0 900 380" className="w-full h-full block" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="routeGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.13 195)" />
            <stop offset="100%" stopColor="oklch(0.52 0.19 258)" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.52 0.19 258 / 0.4)" />
            <stop offset="100%" stopColor="oklch(0.52 0.19 258 / 0)" />
          </radialGradient>
        </defs>

        {/* landmasses (abstract) */}
        <path
          d="M 0 300 Q 200 220, 380 280 T 780 260 T 900 300 L 900 380 L 0 380 Z"
          fill="var(--muted)"
          opacity="0.35"
        />
        <path
          d="M 120 90 Q 260 40, 420 90 T 780 70 L 780 40 L 120 40 Z"
          fill="var(--muted)"
          opacity="0.25"
        />

        {/* full route dim */}
        <path d="M 40 260 C 160 120, 300 340, 460 200 S 720 80, 860 180" fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
        {/* animated dashed traveled */}
        <path d={path} fill="none" stroke="url(#routeGrad)" strokeWidth="4" strokeLinecap="round" className="route-dash" pathLength={100} strokeDasharray={`${p} ${100 - p}`} />

        {/* hubs */}
        {(hubs ?? [
          { x: 220, y: 160, label: "Origin Hub" },
          { x: 620, y: 140, label: "Transit Hub" },
        ]).map((h) => (
          <g key={h.label}>
            <circle cx={h.x} cy={h.y} r="10" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
            <circle cx={h.x} cy={h.y} r="3" fill="var(--accent)" />
            {!compact && (
              <text x={h.x + 14} y={h.y + 4} fontSize="11" fill="var(--muted-foreground)">
                {h.label}
              </text>
            )}
          </g>
        ))}

        {/* origin */}
        <g>
          <circle cx="40" cy="260" r="30" fill="url(#glow)" />
          <circle cx="40" cy="260" r="8" fill="var(--success)" />
        </g>
        {/* destination */}
        <g>
          <circle cx="860" cy="180" r="30" fill="url(#glow)" />
          <circle cx="860" cy="180" r="8" fill="var(--primary)" />
        </g>

        {/* vehicle */}
        <g transform={`translate(${cx - 14} ${cy - 14})`}>
          <circle cx="14" cy="14" r="22" fill="var(--primary)" fillOpacity="0.18" className="animate-pulse-dot" />
          <circle cx="14" cy="14" r="14" fill="var(--primary)" />
          <g transform="translate(6,6)" stroke="white" strokeWidth="1.6" fill="none">
            <path d="M1 8 h9 v-4 h3 l2 3 v5 h-14 z" />
            <circle cx="4" cy="12" r="1.6" fill="white" />
            <circle cx="12" cy="12" r="1.6" fill="white" />
          </g>
        </g>
      </svg>

      {!compact && (
        <>
          <div className="absolute top-3 left-3 glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-success" />
            <span className="font-medium">{from}</span>
          </div>
          <div className="absolute top-3 right-3 glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{to}</span>
          </div>
          <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <Truck className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{Math.round(p)}% complete</span>
            <span className="text-muted-foreground">· AI ETA updating</span>
          </div>
        </>
      )}
    </div>
  );
}
