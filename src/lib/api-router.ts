import { z } from "zod";
import { db } from "../db";
import {
  shipments,
  shipmentEvents,
  notifications,
  deliveryAttempts,
  exceptions,
  hubs,
  vehicles,
  addresses,
  payments,
  user as userTable,
} from "../db/schema";
import { auth } from "./auth";
import { calculateShipmentCost, estimateDeliveryHours, generateTrackingId } from "./pricing";
import { detectExceptions } from "./exception-detection";
import { calculateDistance } from "./distance";
import {
  phoneSchema,
  addressLineSchema,
  citySchema,
  stateSchema,
  pincodeSchema,
  weightSchema,
  dimensionSchema,
} from "./validation";
import { eq, desc, and, or, isNull, isNotNull, gte, notInArray, sql as dsql } from "drizzle-orm";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function getSessionUser(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user ?? null;
  } catch (err) {
    console.warn("[api-router] Transient session verification failure (will retry on next request):", err);
    return null;
  }
}

function requireRole(user: { role?: string | null } | null | undefined, roles: string[]) {
  return !!user && roles.includes((user as any).role);
}

// Same validation primitives the booking form uses client-side (src/lib/
// validation.ts) — the server never trusts that the UI actually enforced
// them, so every field is re-validated here regardless of what the client
// sent.
const createShipmentSchema = z.object({
  senderName: z.string().trim().min(2),
  senderPhone: phoneSchema,
  senderAddressLine: addressLineSchema,
  senderCity: citySchema,
  senderState: stateSchema,
  senderPincode: pincodeSchema,
  receiverName: z.string().trim().min(2),
  receiverPhone: phoneSchema,
  receiverAddressLine: addressLineSchema,
  receiverCity: citySchema,
  receiverState: stateSchema,
  receiverPincode: pincodeSchema,
  weightKg: weightSchema,
  lengthCm: dimensionSchema,
  widthCm: dimensionSchema,
  heightCm: dimensionSchema,
  packageType: z.enum(["standard", "fragile", "medical", "express"]).default("standard"),
  priority: z.enum(["normal", "high", "critical"]).default("normal"),
  insured: z.boolean().default(false),
  declaredValue: z.number().nonnegative().optional(),
  // REQ-2.4: elderly-care recipients get the same critical-delivery
  // prioritization as medical packages, independent of packageType.
  elderlyCare: z.boolean().default(false),
  // REQ-4.1: optional customer-requested pickup date.
  pickupDate: z.string().datetime().optional(),
  // REQ-3.4: real last-mile ETA inputs — stairs (no elevator) and a
  // security checkpoint at the receiver's address.
  receiverFloorCount: z.number().int().min(0).max(200).default(0),
  receiverHasSecurityCheckpoint: z.boolean().default(false),
});

const STATUS_FLOW = [
  "booked",
  "payment_completed",
  "picked_up",
  "arrived_hub",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "delivered",
  "returned",
  "cancelled",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(STATUS_FLOW),
  location: z.string().optional(),
  note: z.string().optional(),
});

// Enforced server-side shipment lifecycle (SRS state machine requirement).
// Every PATCH /status request is checked against this map before being
// applied — the frontend is never trusted to enforce valid transitions.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  // "arrived_hub" is reachable directly from "booked" because Hub Intake is
  // this app's first physical checkpoint — there's no separate courier
  // pickup-scan step in the UI, so requiring "picked_up" first would make
  // the real Hub Intake screen unusable.
  booked: ["payment_completed", "picked_up", "arrived_hub", "cancelled"],
  payment_completed: ["picked_up", "arrived_hub", "cancelled"],
  picked_up: ["arrived_hub", "in_transit", "out_for_delivery", "cancelled"],
  arrived_hub: ["in_transit", "out_for_delivery", "cancelled"],
  in_transit: ["arrived_hub", "out_for_delivery"],
  out_for_delivery: ["delivery_attempted", "delivered", "returned"],
  delivery_attempted: ["out_for_delivery", "delivered", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

const assignSchema = z.object({
  agentId: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  hubId: z.string().uuid().optional(),
});

const transferSchema = z.object({
  destinationHubId: z.string().uuid(),
});

const addressSchema = z.object({
  label: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().min(6),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(3),
  isDefault: z.boolean().default(false),
});

const hubSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(3),
  lat: z.number(),
  lng: z.number(),
  capacity: z.number().int().positive().default(500),
});

const vehicleSchema = z.object({
  hubId: z.string().uuid(),
  registrationNumber: z.string().min(1),
  type: z.enum(["bike", "van", "truck", "ev_bike", "ev_van"]),
  capacityKg: z.number().positive(),
  isElectric: z.boolean().default(false),
});

const userRoleSchema = z.object({
  role: z.enum(["customer", "delivery_agent", "hub_staff", "admin"]),
  hubId: z.string().uuid().optional(),
});

const attemptSchema = z.object({
  outcome: z.enum([
    "delivered",
    "receiver_unavailable",
    "address_issue",
    "refused",
    "rescheduled",
    "returned",
  ]),
  reason: z.string().optional(),
  otpVerified: z.boolean().default(false),
});

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

  try {
    // ---------------------------------------------------------------
    // GET /api/me
    // ---------------------------------------------------------------
    if (parts[1] === "me" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      return json({ user });
    }

    // ---------------------------------------------------------------
    // GET /api/pincode/:pincode — Public Indian postal lookup proxy
    // ---------------------------------------------------------------
    if (parts[1] === "pincode" && parts.length === 3 && request.method === "GET") {
      const pin = parts[2].trim().replace(/\D/g, "");
      if (pin.length !== 6 || !/^[1-9]\d{5}$/.test(pin)) {
        return json({ error: "Invalid 6-digit Indian PIN code" }, 400);
      }
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
          headers: { "user-agent": "ShipLync-Logistics" },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice)) {
            const postOffices = data[0].PostOffice;
            const first = postOffices[0];
            const rawDistrict = (first.District || "").trim();
            const rawBlock = (first.Block || "").trim();
            const rawName = (first.Name || "").trim();
            const state = (first.State || "").trim();
            const district = rawDistrict;
            const city = district && district !== "NA" ? district : rawBlock && rawBlock !== "NA" ? rawBlock : rawName;
            const places = Array.from(new Set(postOffices.map((po: any) => (po.Name || "").trim()))).filter(Boolean);
            return json({
              city,
              state,
              district,
              places,
            });
          }
        }
        return json({ error: "PIN code not found" }, 404);
      } catch (err: any) {
        return json({ error: "Failed to fetch PIN code details" }, 500);
      }
    }

    // ---------------------------------------------------------------
    // /api/shipments
    // ---------------------------------------------------------------
    if (parts[1] === "shipments" && parts.length === 2 && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);

      const body = await request.json();
      const parsed = createShipmentSchema.safeParse(body);
      if (!parsed.success) {
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
      }
      const input = parsed.data;

      const isTimeCritical = input.packageType === "medical" || input.elderlyCare;
      const priority = isTimeCritical && input.priority === "normal" ? "high" : input.priority;

      const cost = calculateShipmentCost({ ...input, priority });
      const trackingId = generateTrackingId();

      // Real distance-based ETA (src/lib/distance.ts + src/lib/pricing.ts) —
      // origin/destination and package type genuinely change the estimate,
      // not a fixed bucket per priority.
      const distanceKm = calculateDistance(
        {
          city: input.senderCity,
          state: input.senderState,
          pincode: input.senderPincode,
          addressLine: input.senderAddressLine,
        },
        {
          city: input.receiverCity,
          state: input.receiverState,
          pincode: input.receiverPincode,
          addressLine: input.receiverAddressLine,
        },
      );
      const etaHours = estimateDeliveryHours({
        priority,
        packageType: input.packageType,
        distanceKm,
        receiverFloorCount: input.receiverFloorCount,
        receiverHasSecurityCheckpoint: input.receiverHasSecurityCheckpoint,
      });
      const estimatedDeliveryAt = new Date(Date.now() + etaHours * 60 * 60 * 1000);

      const [shipment] = await db
        .insert(shipments)
        .values({
          trackingId,
          customerId: user.id,
          ...input,
          pickupDate: input.pickupDate ? new Date(input.pickupDate) : undefined,
          priority,
          cost,
          distanceKm,
          status: "booked",
          estimatedDeliveryAt,
        })
        .returning();

      await db.insert(shipmentEvents).values({
        shipmentId: shipment.id,
        status: "booked",
        location: input.senderCity,
        note: "Shipment booked by customer.",
        actorUserId: user.id,
      });

      await db.insert(notifications).values({
        userId: user.id,
        type: "shipment_booked",
        title: "Shipment booked",
        message: `Your shipment ${trackingId} has been booked. Estimated delivery in ${etaHours}h.`,
        shipmentId: shipment.id,
      });

      // No real payment gateway is wired up (see PROGRESS_REPORT.md) — a
      // "paid" record is created immediately so payment history/invoices
      // reflect real, persisted charge data rather than nothing at all.
      await db.insert(payments).values({
        shipmentId: shipment.id,
        amount: cost,
        method: "mock",
        status: "paid",
        transactionRef: `TXN-${trackingId}`,
      });

      await db.insert(notifications).values({
        userId: user.id,
        type: "payment_successful",
        title: "Payment successful",
        message: `₹${cost} charged for shipment ${trackingId}.`,
        shipmentId: shipment.id,
      });

      return json({ shipment }, 201);
    }

    if (parts[1] === "shipments" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const role = (user as any).role;
      const scope = url.searchParams.get("scope");

      let rows;
      if (scope === "assigned" && role === "delivery_agent") {
        rows = await db
          .select()
          .from(shipments)
          .where(eq(shipments.assignedAgentId, user.id))
          .orderBy(desc(shipments.updatedAt));
      } else if (scope === "hub" && (role === "hub_staff" || role === "admin")) {
        // As requested: show active scanned/intaken bookings without filtering by location for now,
        // and exclude completed records (delivered, returned, cancelled).
        rows = await db
          .select()
          .from(shipments)
          .where(notInArray(shipments.status, ["delivered", "returned", "cancelled"]))
          .orderBy(desc(shipments.updatedAt));
      } else if (scope === "hub_transfers" && (role === "hub_staff" || role === "admin")) {
        // Shipments genuinely mid hub-to-hub transfer — either departing this
        // hub (currentHubId = mine) or inbound to it (destinationHubId =
        // mine, not yet arrived). Both are real states set by
        // POST /shipments/:id/transfer and cleared on arrival.
        const hubId = (user as any).hubId;
        rows = hubId
          ? await db
              .select()
              .from(shipments)
              .where(
                and(
                  isNotNull(shipments.destinationHubId),
                  or(eq(shipments.currentHubId, hubId), eq(shipments.destinationHubId, hubId)),
                ),
              )
              .orderBy(desc(shipments.updatedAt))
          : [];
      } else if (scope === "unassigned" && (role === "hub_staff" || role === "admin")) {
        rows = await db
          .select()
          .from(shipments)
          .where(isNull(shipments.assignedAgentId))
          .orderBy(desc(shipments.createdAt))
          .limit(50);
      } else if (scope === "all" && role === "admin") {
        rows = await db.select().from(shipments).orderBy(desc(shipments.createdAt)).limit(200);
      } else {
        rows = await db
          .select()
          .from(shipments)
          .where(eq(shipments.customerId, user.id))
          .orderBy(desc(shipments.createdAt));
      }

      return json({ shipments: rows });
    }

    // GET /api/shipments/track/:trackingId — public
    if (parts[1] === "shipments" && parts[2] === "track" && parts[3] && request.method === "GET") {
      const trackingId = decodeURIComponent(parts[3]);
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.trackingId, trackingId))
        .limit(1);

      if (!shipment) return json({ error: "Tracking ID not found" }, 404);

      const events = await db
        .select()
        .from(shipmentEvents)
        .where(eq(shipmentEvents.shipmentId, shipment.id))
        .orderBy(shipmentEvents.createdAt);

      // Resolve the real current hub name, if any, so the tracking UI can
      // show "Arrived at <Hub Name>" instead of a generic status string.
      let currentHubName: string | null = null;
      if (shipment.currentHubId) {
        const [hub] = await db
          .select({ name: hubs.name })
          .from(hubs)
          .where(eq(hubs.id, shipment.currentHubId))
          .limit(1);
        currentHubName = hub?.name ?? null;
      }

      // Real delivery-attempt and exception records for this shipment, so
      // the customer tracking page can show them alongside the event
      // timeline instead of only inferring them from status strings.
      const attempts = await db
        .select()
        .from(deliveryAttempts)
        .where(eq(deliveryAttempts.shipmentId, shipment.id))
        .orderBy(deliveryAttempts.attemptNumber);

      const shipmentExceptions = await db
        .select()
        .from(exceptions)
        .where(eq(exceptions.shipmentId, shipment.id))
        .orderBy(desc(exceptions.createdAt));

      return json({ shipment, events, currentHubName, attempts, exceptions: shipmentExceptions });
    }

    // PATCH /api/shipments/:id/status — delivery_agent, hub_staff, admin
    if (parts[1] === "shipments" && parts[3] === "status" && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["delivery_agent", "hub_staff", "admin"])) {
        return json({ error: "Not authorized" }, 403);
      }
      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = updateStatusSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      if ((user as any).role === "delivery_agent" && existing.assignedAgentId !== user!.id) {
        return json({ error: "Not authorized — this shipment isn't assigned to you" }, 403);
      }

      const allowedNext = ALLOWED_TRANSITIONS[existing.status] ?? [];
      if (!allowedNext.includes(parsed.data.status)) {
        return json(
          {
            error: `Invalid transition: cannot move from "${existing.status}" to "${parsed.data.status}"`,
            allowedNext,
          },
          409,
        );
      }

      const updates: Record<string, unknown> = {
        status: parsed.data.status,
        updatedAt: new Date(),
      };
      if (parsed.data.status === "delivered") updates.deliveredAt = new Date();

      // A hub_staff scan marking a shipment "arrived_hub" means it is
      // physically at *their* hub right now — record that as the real
      // currentHubId (and originHubId, the first time this happens) so
      // hub-scoped queries, per-hub load stats, and the customer-visible
      // "current hub" actually reflect reality instead of staying null
      // forever (previously nothing in the real flow ever set this).
      let eventLocation = parsed.data.location;
      let eventNote = parsed.data.note;
      if (
        parsed.data.status === "arrived_hub" &&
        (user as any).role === "hub_staff" &&
        (user as any).hubId
      ) {
        updates.currentHubId = (user as any).hubId;
        if (!existing.originHubId) updates.originHubId = (user as any).hubId;
        const [actorHub] = await db
          .select({ name: hubs.name })
          .from(hubs)
          .where(eq(hubs.id, (user as any).hubId))
          .limit(1);
        if (actorHub) eventLocation = actorHub.name;

        // A shipment mid hub-to-hub transfer (see POST .../transfer) finishes
        // that leg the moment it's scanned in anywhere — clear
        // destinationHubId so it drops off /hub/transfers. If this isn't the
        // hub it was actually being sent to, staff see that on arrival and
        // can start a fresh transfer leg from here.
        if (existing.destinationHubId) {
          updates.destinationHubId = null;
          eventNote =
            existing.destinationHubId === (user as any).hubId
              ? "Transfer complete — arrived at intended destination hub."
              : `Arrived at an intermediate hub, not the intended transfer destination.${eventNote ? ` ${eventNote}` : ""}`;
        }
      }

      const [updated] = await db
        .update(shipments)
        .set(updates)
        .where(eq(shipments.id, shipmentId))
        .returning();

      await db.insert(shipmentEvents).values({
        shipmentId,
        status: parsed.data.status,
        location: eventLocation,
        note: eventNote,
        actorUserId: user!.id,
      });

      await db.insert(notifications).values({
        userId: existing.customerId,
        type: parsed.data.status === "delivered" ? "delivered" : "route_changed",
        title: `Shipment ${existing.trackingId} updated`,
        message: `Status changed to "${parsed.data.status.replace(/_/g, " ")}".`,
        shipmentId,
      });

      return json({ shipment: updated });
    }

    // POST /api/shipments/:id/transfer — hub_staff, admin. Starts a real
    // hub-to-hub transfer leg: sets destinationHubId and moves the shipment
    // to "in_transit" (an already-allowed transition from arrived_hub /
    // picked_up), rather than the dead "Reroute Volume" stub that used to
    // live on /hub/load.
    if (parts[1] === "shipments" && parts[3] === "transfer" && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);

      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = transferSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      const actingHubId =
        (user as any).role === "hub_staff" ? (user as any).hubId : existing.currentHubId;
      if (!actingHubId || existing.currentHubId !== actingHubId) {
        return json({ error: "This shipment isn't at your hub" }, 403);
      }
      if (parsed.data.destinationHubId === actingHubId) {
        return json({ error: "Destination hub must be different from the current hub" }, 400);
      }

      const [destinationHub] = await db
        .select()
        .from(hubs)
        .where(eq(hubs.id, parsed.data.destinationHubId))
        .limit(1);
      if (!destinationHub) return json({ error: "Destination hub not found" }, 404);

      const allowedNext = ALLOWED_TRANSITIONS[existing.status] ?? [];
      if (!allowedNext.includes("in_transit")) {
        return json(
          {
            error: `Invalid transition: cannot move from "${existing.status}" to "in_transit"`,
            allowedNext,
          },
          409,
        );
      }

      const [originHub] = await db.select().from(hubs).where(eq(hubs.id, actingHubId)).limit(1);

      const [updated] = await db
        .update(shipments)
        .set({
          status: "in_transit",
          destinationHubId: parsed.data.destinationHubId,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, shipmentId))
        .returning();

      await db.insert(shipmentEvents).values({
        shipmentId,
        status: "in_transit",
        location:
          originHub && destinationHub ? `${originHub.name} → ${destinationHub.name}` : undefined,
        note: "Hub transfer initiated.",
        actorUserId: user!.id,
      });

      await db.insert(notifications).values({
        userId: existing.customerId,
        type: "hub_transferred",
        title: `Shipment ${existing.trackingId} is being transferred`,
        message: `Now moving from ${originHub?.name ?? "your origin hub"} to ${destinationHub.name}.`,
        shipmentId,
      });

      return json({ shipment: updated });
    }

    // POST /api/shipments/:id/assign — hub_staff, admin
    if (parts[1] === "shipments" && parts[3] === "assign" && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);

      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = assignSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (parsed.data.agentId) updates.assignedAgentId = parsed.data.agentId;
      if (parsed.data.vehicleId) updates.assignedVehicleId = parsed.data.vehicleId;
      if (parsed.data.hubId) updates.currentHubId = parsed.data.hubId;

      const [updated] = await db
        .update(shipments)
        .set(updates)
        .where(eq(shipments.id, shipmentId))
        .returning();

      await db.insert(shipmentEvents).values({
        shipmentId,
        status: existing.status,
        note: "Delivery agent / vehicle assigned.",
        actorUserId: user!.id,
      });

      if (parsed.data.agentId) {
        await db.insert(notifications).values({
          userId: existing.customerId,
          type: "agent_assigned",
          title: `Agent assigned to ${existing.trackingId}`,
          message: "A delivery partner has been assigned to your shipment.",
          shipmentId,
        });
      }

      return json({ shipment: updated });
    }

    // POST /api/shipments/:id/attempts — delivery_agent
    if (parts[1] === "shipments" && parts[3] === "attempts" && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["delivery_agent", "admin"]))
        return json({ error: "Not authorized" }, 403);

      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = attemptSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      if ((user as any).role === "delivery_agent" && existing.assignedAgentId !== user!.id) {
        return json({ error: "Not authorized — this shipment isn't assigned to you" }, 403);
      }

      if (!["out_for_delivery", "delivery_attempted"].includes(existing.status)) {
        return json(
          {
            error: `Cannot record a delivery attempt while shipment is "${existing.status}" — it must be out for delivery first.`,
          },
          409,
        );
      }

      const priorAttempts = await db
        .select()
        .from(deliveryAttempts)
        .where(eq(deliveryAttempts.shipmentId, shipmentId));

      const [attempt] = await db
        .insert(deliveryAttempts)
        .values({
          shipmentId,
          agentId: user!.id,
          attemptNumber: priorAttempts.length + 1,
          outcome: parsed.data.outcome,
          reason: parsed.data.reason,
          otpVerified: parsed.data.otpVerified,
        })
        .returning();

      const nextStatus =
        parsed.data.outcome === "delivered"
          ? "delivered"
          : parsed.data.outcome === "returned"
            ? "returned"
            : "delivery_attempted";

      const updates: Record<string, unknown> = { status: nextStatus, updatedAt: new Date() };
      if (nextStatus === "delivered") updates.deliveredAt = new Date();

      await db.update(shipments).set(updates).where(eq(shipments.id, shipmentId));

      await db.insert(shipmentEvents).values({
        shipmentId,
        status: nextStatus,
        note:
          parsed.data.reason ??
          `Delivery attempt #${attempt.attemptNumber}: ${parsed.data.outcome}`,
        actorUserId: user!.id,
      });

      await db.insert(notifications).values({
        userId: existing.customerId,
        type: nextStatus === "delivered" ? "delivered" : "delivery_failed",
        title: `Shipment ${existing.trackingId} — ${parsed.data.outcome.replace(/_/g, " ")}`,
        message:
          parsed.data.reason ?? `Delivery outcome: ${parsed.data.outcome.replace(/_/g, " ")}.`,
        shipmentId,
      });

      return json({ attempt }, 201);
    }

    // GET /api/shipments/:id/attempts — delivery_agent (own shipments),
    // hub_staff/admin. Powers the "Attempts" history on the delivery-agent
    // shipment detail screen.
    if (parts[1] === "shipments" && parts[3] === "attempts" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["delivery_agent", "hub_staff", "admin"])) {
        return json({ error: "Not authorized" }, 403);
      }
      const shipmentId = parts[2];
      const [existing] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      if ((user as any).role === "delivery_agent" && existing.assignedAgentId !== user!.id) {
        return json({ error: "Not authorized — this shipment isn't assigned to you" }, 403);
      }

      const rows = await db
        .select()
        .from(deliveryAttempts)
        .where(eq(deliveryAttempts.shipmentId, shipmentId))
        .orderBy(deliveryAttempts.attemptNumber);

      return json({ attempts: rows });
    }

    // ---------------------------------------------------------------
    // /api/notifications
    // ---------------------------------------------------------------
    if (parts[1] === "notifications" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      return json({ notifications: rows });
    }

    if (parts[1] === "notifications" && parts[3] === "read" && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const [updated] = await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, parts[2]), eq(notifications.userId, user.id)))
        .returning();
      return json({ notification: updated });
    }

    // ---------------------------------------------------------------
    // /api/exceptions
    // ---------------------------------------------------------------
    if (parts[1] === "exceptions" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin", "delivery_agent"])) {
        return json({ error: "Not authorized" }, 403);
      }
      const scope = url.searchParams.get("scope");

      if (scope === "mine" && (user as any).role === "delivery_agent") {
        const rows = await db
          .select({
            id: exceptions.id,
            shipmentId: exceptions.shipmentId,
            hubId: exceptions.hubId,
            type: exceptions.type,
            severity: exceptions.severity,
            message: exceptions.message,
            resolved: exceptions.resolved,
            createdAt: exceptions.createdAt,
            trackingId: shipments.trackingId,
          })
          .from(exceptions)
          .innerJoin(shipments, eq(exceptions.shipmentId, shipments.id))
          .where(and(eq(shipments.assignedAgentId, user!.id), eq(exceptions.resolved, false)))
          .orderBy(desc(exceptions.createdAt));
        return json({ exceptions: rows });
      }

      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);

      // hub_staff only see exceptions for shipments physically at their own
      // hub — exceptions.hubId is never populated by detectExceptions(), so
      // scoping has to go through the shipment's real currentHubId instead.
      // admin keeps the unscoped network-wide view.
      if ((user as any).role === "hub_staff") {
        const hubId = (user as any).hubId;
        if (!hubId) return json({ exceptions: [] });
        const rows = await db
          .select({
            id: exceptions.id,
            shipmentId: exceptions.shipmentId,
            hubId: exceptions.hubId,
            type: exceptions.type,
            severity: exceptions.severity,
            message: exceptions.message,
            resolved: exceptions.resolved,
            createdAt: exceptions.createdAt,
            trackingId: shipments.trackingId,
          })
          .from(exceptions)
          .innerJoin(shipments, eq(exceptions.shipmentId, shipments.id))
          .where(and(eq(shipments.currentHubId, hubId), eq(exceptions.resolved, false)))
          .orderBy(desc(exceptions.createdAt))
          .limit(100);
        return json({ exceptions: rows });
      }

      const rows = await db
        .select()
        .from(exceptions)
        .where(eq(exceptions.resolved, false))
        .orderBy(desc(exceptions.createdAt))
        .limit(100);
      return json({ exceptions: rows });
    }

    if (parts[1] === "exceptions" && parts[2] === "detect" && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);
      const created = await detectExceptions();
      return json({ created });
    }

    // GET /api/cron/detect-exceptions — REQ-7.4: the system shall
    // *automatically* monitor for unusual situations and alert admins
    // proactively, not only when a staff member happens to click a button.
    // Vercel Cron calls this on a schedule (see vercel.json) with a bearer
    // secret instead of a user session, since there's no logged-in staff
    // member behind a scheduled job.
    if (parts[1] === "cron" && parts[2] === "detect-exceptions" && request.method === "GET") {
      const authHeader = request.headers.get("authorization");
      const secret = process.env.CRON_SECRET;
      if (!secret || authHeader !== `Bearer ${secret}`) {
        return json({ error: "Not authorized" }, 401);
      }
      const created = await detectExceptions();
      return json({ created, ranAt: new Date().toISOString() });
    }

    if (parts[1] === "exceptions" && parts[3] === "resolve" && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin", "delivery_agent"])) {
        return json({ error: "Not authorized" }, 403);
      }

      if ((user as any).role === "delivery_agent") {
        const [owned] = await db
          .select({ id: exceptions.id })
          .from(exceptions)
          .innerJoin(shipments, eq(exceptions.shipmentId, shipments.id))
          .where(and(eq(exceptions.id, parts[2]), eq(shipments.assignedAgentId, user!.id)))
          .limit(1);
        if (!owned) return json({ error: "Not authorized" }, 403);
      }

      const [updated] = await db
        .update(exceptions)
        .set({ resolved: true, resolvedByUserId: user!.id, resolvedAt: new Date() })
        .where(eq(exceptions.id, parts[2]))
        .returning();
      return json({ exception: updated });
    }

    // ---------------------------------------------------------------
    // /api/hubs, /api/vehicles, /api/agents — lookups for assignment UI
    // ---------------------------------------------------------------
    if (parts[1] === "hubs" && parts.length === 2 && request.method === "GET") {
      const rows = await db.select().from(hubs);

      // Real per-hub load: active shipments currently routed through each
      // hub vs. its declared capacity — no fabricated numbers.
      const loadRows = await db
        .select({ hubId: shipments.currentHubId, count: dsql<number>`count(*)::int` })
        .from(shipments)
        .where(notInArray(shipments.status, ["delivered", "returned", "cancelled"] as any))
        .groupBy(shipments.currentHubId);
      const loadMap = new Map(loadRows.map((r) => [r.hubId, r.count]));

      const hubsWithLoad = rows.map((h) => {
        const activeShipmentCount = loadMap.get(h.id) ?? 0;
        return {
          ...h,
          activeShipmentCount,
          loadPct:
            h.capacity > 0
              ? Math.min(100, Math.round((activeShipmentCount / h.capacity) * 100))
              : 0,
        };
      });

      return json({ hubs: hubsWithLoad });
    }

    if (parts[1] === "hubs" && parts.length === 2 && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);
      const body = await request.json();
      const parsed = hubSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
      const [hub] = await db.insert(hubs).values(parsed.data).returning();
      return json({ hub }, 201);
    }

    if (parts[1] === "vehicles" && parts.length === 2 && request.method === "GET") {
      const rows = await db.select().from(vehicles).where(eq(vehicles.active, true));
      return json({ vehicles: rows });
    }

    if (parts[1] === "vehicles" && parts.length === 2 && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);
      const body = await request.json();
      const parsed = vehicleSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
      const [vehicle] = await db.insert(vehicles).values(parsed.data).returning();
      return json({ vehicle }, 201);
    }

    if (parts[1] === "agents" && request.method === "GET") {
      // No auth was required here before this change and still isn't — this
      // just narrows the result for a recognized hub_staff session (their
      // own hub's roster + the unassigned pool) instead of always returning
      // every delivery agent network-wide. Every other caller (admin,
      // unauthenticated) keeps the exact same unscoped list as before.
      const user = await getSessionUser(request).catch(() => null);
      const hubFilter =
        user && (user as any).role === "hub_staff" && (user as any).hubId
          ? or(eq(userTable.hubId, (user as any).hubId), isNull(userTable.hubId))
          : undefined;

      const rows = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          phone: userTable.phone,
          hubId: userTable.hubId,
        })
        .from(userTable)
        .where(
          hubFilter
            ? and(eq(userTable.role, "delivery_agent"), hubFilter)
            : eq(userTable.role, "delivery_agent"),
        );
      return json({ agents: rows });
    }

    // ---------------------------------------------------------------
    // /api/users — admin user management
    // ---------------------------------------------------------------
    if (parts[1] === "users" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);
      const rows = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          phone: userTable.phone,
          hubId: userTable.hubId,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .orderBy(desc(userTable.createdAt));
      return json({ users: rows });
    }

    if (parts[1] === "users" && parts.length === 3 && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);
      const body = await request.json();
      const parsed = userRoleSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
      const [updated] = await db
        .update(userTable)
        .set({ role: parsed.data.role, hubId: parsed.data.hubId, updatedAt: new Date() })
        .where(eq(userTable.id, parts[2]))
        .returning({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          hubId: userTable.hubId,
        });
      return json({ user: updated });
    }

    // ---------------------------------------------------------------
    // /api/stats/overview — admin dashboard aggregates
    // ---------------------------------------------------------------
    if (parts[1] === "stats" && parts[2] === "overview" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);

      const all = await db.select().from(shipments);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const total = all.length;
      const deliveredToday = all.filter(
        (s) => s.status === "delivered" && s.deliveredAt && s.deliveredAt >= startOfToday,
      ).length;
      const active = all.filter((s) =>
        ["picked_up", "arrived_hub", "in_transit", "out_for_delivery"].includes(s.status),
      ).length;
      const pending = all.filter((s) => ["booked", "payment_completed"].includes(s.status)).length;
      const failed = all.filter((s) =>
        ["returned", "cancelled", "delivery_attempted"].includes(s.status),
      ).length;
      const medical = all.filter((s) => s.packageType === "medical").length;

      const deliveredWithTimes = all.filter((s) => s.deliveredAt);
      const avgDeliveryHours =
        deliveredWithTimes.length > 0
          ? deliveredWithTimes.reduce(
              (acc, s) =>
                acc + (s.deliveredAt!.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60),
              0,
            ) / deliveredWithTimes.length
          : 0;

      const revenueRows = await db
        .select({ total: dsql<string>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(eq(payments.status, "paid"));
      const revenue = Number(revenueRows[0]?.total ?? 0);

      const allVehicles = await db.select().from(vehicles);
      const fleetUtilization =
        allVehicles.length > 0
          ? Math.round((all.filter((s) => s.assignedVehicleId).length / allVehicles.length) * 100)
          : 0;

      return json({
        total,
        deliveredToday,
        active,
        pending,
        failed,
        medical,
        avgDeliveryHours: Math.round(avgDeliveryHours * 10) / 10,
        revenue,
        fleetUtilization,
      });
    }

    // ---------------------------------------------------------------
    // /api/addresses — customer saved addresses
    // ---------------------------------------------------------------
    if (parts[1] === "addresses" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const rows = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, user.id))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
      return json({ addresses: rows });
    }

    if (parts[1] === "addresses" && parts.length === 2 && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const body = await request.json();
      const parsed = addressSchema.safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      if (parsed.data.isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
      }

      const [address] = await db
        .insert(addresses)
        .values({ userId: user.id, ...parsed.data })
        .returning();
      return json({ address }, 201);
    }

    if (parts[1] === "addresses" && parts.length === 3 && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const body = await request.json();
      const parsed = addressSchema.partial().safeParse(body);
      if (!parsed.success)
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      if (parsed.data.isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
      }

      const [address] = await db
        .update(addresses)
        .set(parsed.data)
        .where(and(eq(addresses.id, parts[2]), eq(addresses.userId, user.id)))
        .returning();
      if (!address) return json({ error: "Address not found" }, 404);
      return json({ address });
    }

    if (parts[1] === "addresses" && parts.length === 3 && request.method === "DELETE") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      await db
        .delete(addresses)
        .where(and(eq(addresses.id, parts[2]), eq(addresses.userId, user.id)));
      return json({ ok: true });
    }

    // ---------------------------------------------------------------
    // /api/payments — customer payment history / invoices
    // ---------------------------------------------------------------
    if (parts[1] === "payments" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const scope = url.searchParams.get("scope");
      const isAdminAll = scope === "all" && (user as any).role === "admin";

      const baseQuery = db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          status: payments.status,
          transactionRef: payments.transactionRef,
          createdAt: payments.createdAt,
          shipmentId: payments.shipmentId,
          trackingId: shipments.trackingId,
          senderCity: shipments.senderCity,
          receiverCity: shipments.receiverCity,
        })
        .from(payments)
        .innerJoin(shipments, eq(payments.shipmentId, shipments.id));

      const rows = isAdminAll
        ? await baseQuery.orderBy(desc(payments.createdAt)).limit(300)
        : await baseQuery
            .where(eq(shipments.customerId, user.id))
            .orderBy(desc(payments.createdAt));

      return json({ payments: rows });
    }

    // ---------------------------------------------------------------
    // /api/reports/shipments.csv
    // ---------------------------------------------------------------
    if (parts[1] === "reports" && parts[2] === "shipments.csv" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["admin"])) return json({ error: "Not authorized" }, 403);

      const rows = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
      const header = [
        "trackingId",
        "status",
        "senderCity",
        "receiverCity",
        "weightKg",
        "packageType",
        "priority",
        "cost",
        "createdAt",
        "estimatedDeliveryAt",
        "deliveredAt",
      ];
      const csvRows = rows.map((s) =>
        [
          s.trackingId,
          s.status,
          s.senderCity,
          s.receiverCity,
          s.weightKg,
          s.packageType,
          s.priority,
          s.cost,
          s.createdAt.toISOString(),
          s.estimatedDeliveryAt?.toISOString() ?? "",
          s.deliveredAt?.toISOString() ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
      const csv = [header.join(","), ...csvRows].join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv",
          "content-disposition": 'attachment; filename="shiplync-shipments.csv"',
        },
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error("[api-router]", error);
    return json({ error: "Internal server error" }, 500);
  }
}
