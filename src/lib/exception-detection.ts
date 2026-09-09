// Deterministic exception detection over shipment state (SRS REQ-7.4).
// Rules, not ML — each one is a documented threshold check.

import { db } from "../db";
import { shipments, deliveryAttempts, exceptions } from "../db/schema";
import { and, eq, lt, ne, notInArray, isNull } from "drizzle-orm";

const STATIONARY_THRESHOLD_HOURS = 48; // matches SRS 4.7 example verbatim
const DELAYED_GRACE_HOURS = 2; // past estimatedDeliveryAt before flagging
const REPEATED_FAILURE_THRESHOLD = 2;

const TERMINAL_STATUSES = ["delivered", "returned", "cancelled"];

async function hasOpenException(shipmentId: string, type: string) {
  const rows = await db
    .select()
    .from(exceptions)
    .where(and(eq(exceptions.shipmentId, shipmentId), eq(exceptions.type, type as any), eq(exceptions.resolved, false)))
    .limit(1);
  return rows.length > 0;
}

export async function detectExceptions() {
  const created: { type: string; shipmentId: string; severity: string }[] = [];
  const now = Date.now();

  const active = await db
    .select()
    .from(shipments)
    .where(notInArray(shipments.status, TERMINAL_STATUSES as any));

  for (const shipment of active) {
    // Rule 1: stationary too long — no status change in STATIONARY_THRESHOLD_HOURS.
    const hoursSinceUpdate = (now - shipment.updatedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate >= STATIONARY_THRESHOLD_HOURS) {
      if (!(await hasOpenException(shipment.id, "stationary_too_long"))) {
        await db.insert(exceptions).values({
          shipmentId: shipment.id,
          type: "stationary_too_long",
          severity: "critical",
          message: `Shipment ${shipment.trackingId} has had no status update in ${Math.floor(hoursSinceUpdate)}h (status: ${shipment.status}).`,
        });
        created.push({ type: "stationary_too_long", shipmentId: shipment.id, severity: "critical" });
      }
    }

    // Rule 2: delayed beyond threshold — past ETA and not delivered.
    if (shipment.estimatedDeliveryAt) {
      const hoursPastEta = (now - shipment.estimatedDeliveryAt.getTime()) / (1000 * 60 * 60);
      if (hoursPastEta >= DELAYED_GRACE_HOURS) {
        if (!(await hasOpenException(shipment.id, "delayed_beyond_threshold"))) {
          await db.insert(exceptions).values({
            shipmentId: shipment.id,
            type: "delayed_beyond_threshold",
            severity: shipment.priority === "critical" ? "critical" : "warning",
            message: `Shipment ${shipment.trackingId} is ${Math.floor(hoursPastEta)}h past its estimated delivery time.`,
          });
          created.push({ type: "delayed_beyond_threshold", shipmentId: shipment.id, severity: "warning" });
        }
      }
    }

    // Rule 3: repeated failed delivery attempts.
    const attempts = await db
      .select()
      .from(deliveryAttempts)
      .where(eq(deliveryAttempts.shipmentId, shipment.id));
    const failedCount = attempts.filter((a) => a.outcome !== "delivered").length;
    if (failedCount >= REPEATED_FAILURE_THRESHOLD) {
      if (!(await hasOpenException(shipment.id, "repeated_failed_delivery"))) {
        await db.insert(exceptions).values({
          shipmentId: shipment.id,
          type: "repeated_failed_delivery",
          severity: "warning",
          message: `Shipment ${shipment.trackingId} has had ${failedCount} failed delivery attempts.`,
        });
        created.push({ type: "repeated_failed_delivery", shipmentId: shipment.id, severity: "warning" });
      }
    }
  }

  return created;
}
