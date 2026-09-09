import { z } from "zod";
import { db } from "../db";
import { shipments, shipmentEvents, notifications } from "../db/schema";
import { auth } from "./auth";
import { calculateShipmentCost, estimateDeliveryHours, generateTrackingId } from "./pricing";
import { eq, desc } from "drizzle-orm";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function getSessionUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const createShipmentSchema = z.object({
  senderName: z.string().min(1),
  senderPhone: z.string().min(6),
  senderAddressLine: z.string().min(1),
  senderCity: z.string().min(1),
  senderState: z.string().min(1),
  senderPincode: z.string().min(3),
  receiverName: z.string().min(1),
  receiverPhone: z.string().min(6),
  receiverAddressLine: z.string().min(1),
  receiverCity: z.string().min(1),
  receiverState: z.string().min(1),
  receiverPincode: z.string().min(3),
  weightKg: z.number().positive(),
  packageType: z.enum(["standard", "fragile", "medical", "express"]).default("standard"),
  priority: z.enum(["normal", "high", "critical"]).default("normal"),
  insured: z.boolean().default(false),
  declaredValue: z.number().nonnegative().optional(),
});

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api", "shipments", ...]

  try {
    // GET /api/me
    if (parts[1] === "me" && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      return json({ user });
    }

    // POST /api/shipments — create a shipment (customer only)
    if (parts[1] === "shipments" && parts.length === 2 && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);

      const body = await request.json();
      const parsed = createShipmentSchema.safeParse(body);
      if (!parsed.success) {
        return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
      }
      const input = parsed.data;

      // Medical packages are always treated as at least high priority (SRS REQ-2.4).
      const priority =
        input.packageType === "medical" && input.priority === "normal" ? "high" : input.priority;

      const cost = calculateShipmentCost({ ...input, priority });
      const trackingId = generateTrackingId();
      const etaHours = estimateDeliveryHours({ priority, packageType: input.packageType });
      const estimatedDeliveryAt = new Date(Date.now() + etaHours * 60 * 60 * 1000);

      const [shipment] = await db
        .insert(shipments)
        .values({
          trackingId,
          customerId: user.id,
          ...input,
          priority,
          cost,
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

      return json({ shipment }, 201);
    }

    // GET /api/shipments — list current user's shipments
    if (parts[1] === "shipments" && parts.length === 2 && request.method === "GET") {
      const user = await getSessionUser(request);
      if (!user) return json({ error: "Not authenticated" }, 401);

      const rows = await db
        .select()
        .from(shipments)
        .where(eq(shipments.customerId, user.id))
        .orderBy(desc(shipments.createdAt));

      return json({ shipments: rows });
    }

    // GET /api/shipments/track/:trackingId — public tracking lookup
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

      return json({ shipment, events });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error("[api-router]", error);
    return json({ error: "Internal server error" }, 500);
  }
}
