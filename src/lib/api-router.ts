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
import { eq, desc, and, isNull } from "drizzle-orm";

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

function requireRole(user: { role?: string } | null, roles: string[]) {
  return !!user && roles.includes((user as any).role);
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

const assignSchema = z.object({
  agentId: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  hubId: z.string().uuid().optional(),
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
        const hubId = (user as any).hubId;
        rows = hubId
          ? await db
              .select()
              .from(shipments)
              .where(eq(shipments.currentHubId, hubId))
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

      return json({ shipment, events });
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
      if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

      const updates: Record<string, unknown> = {
        status: parsed.data.status,
        updatedAt: new Date(),
      };
      if (parsed.data.status === "delivered") updates.deliveredAt = new Date();

      const [updated] = await db
        .update(shipments)
        .set(updates)
        .where(eq(shipments.id, shipmentId))
        .returning();

      await db.insert(shipmentEvents).values({
        shipmentId,
        status: parsed.data.status,
        location: parsed.data.location,
        note: parsed.data.note,
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

    // POST /api/shipments/:id/assign — hub_staff, admin
    if (parts[1] === "shipments" && parts[3] === "assign" && request.method === "POST") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);

      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = assignSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
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
      if (!requireRole(user, ["delivery_agent", "admin"])) return json({ error: "Not authorized" }, 403);

      const shipmentId = parts[2];
      const body = await request.json();
      const parsed = attemptSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      const [existing] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
      if (!existing) return json({ error: "Shipment not found" }, 404);

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
        note: parsed.data.reason ?? `Delivery attempt #${attempt.attemptNumber}: ${parsed.data.outcome}`,
        actorUserId: user!.id,
      });

      await db.insert(notifications).values({
        userId: existing.customerId,
        type: nextStatus === "delivered" ? "delivered" : "delivery_failed",
        title: `Shipment ${existing.trackingId} — ${parsed.data.outcome.replace(/_/g, " ")}`,
        message: parsed.data.reason ?? `Delivery outcome: ${parsed.data.outcome.replace(/_/g, " ")}.`,
        shipmentId,
      });

      return json({ attempt }, 201);
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
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);
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

    if (parts[1] === "exceptions" && parts[3] === "resolve" && request.method === "PATCH") {
      const user = await getSessionUser(request);
      if (!requireRole(user, ["hub_staff", "admin"])) return json({ error: "Not authorized" }, 403);
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
    if (parts[1] === "hubs" && request.method === "GET") {
      const rows = await db.select().from(hubs);
      return json({ hubs: rows });
    }

    if (parts[1] === "vehicles" && request.method === "GET") {
      const rows = await db.select().from(vehicles).where(eq(vehicles.active, true));
      return json({ vehicles: rows });
    }

    if (parts[1] === "agents" && request.method === "GET") {
      const rows = await db
        .select({ id: userTable.id, name: userTable.name, phone: userTable.phone, hubId: userTable.hubId })
        .from(userTable)
        .where(eq(userTable.role, "delivery_agent"));
      return json({ agents: rows });
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
      if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

      if (parsed.data.isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
      }

      const [address] = await db
        .insert(addresses)
        .values({ userId: user.id, ...parsed.data })
        .returning();
      return json({ address }, 201);
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

      const rows = await db
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
        .innerJoin(shipments, eq(payments.shipmentId, shipments.id))
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
