import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { StatusTag, PriorityTag } from "./Tags";
import { formatEta, type RealShipment } from "@/lib/driver";

// One scannable line per shipment — tracking ID, recipient, location,
// status, priority, ETA. Deliberately not a "card": an agent needs to scan
// many of these quickly, not admire each one.
export function DeliveryRow({ shipment, index }: { shipment: RealShipment; index?: number }) {
  return (
    <Link
      to="/driver/shipment/$id"
      params={{ id: shipment.id }}
      className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors"
    >
      {index != null && (
        <div className="h-6 w-6 shrink-0 rounded-full border grid place-items-center text-[11px] font-semibold text-muted-foreground">
          {index}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {shipment.receiverName}
          </span>
          <PriorityTag shipment={shipment} />
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {shipment.receiverAddressLine}, {shipment.receiverCity}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-muted-foreground">{shipment.trackingId}</span>
          <StatusTag status={shipment.status} />
          <span className="text-[11px] text-muted-foreground">{formatEta(shipment)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
