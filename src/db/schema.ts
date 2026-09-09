import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  pgEnum,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Auth (better-auth manages these; columns beyond its defaults are additional
// fields we asked better-auth to create on `user`). Kept here so Drizzle
// migrations own the whole schema in one place.
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "delivery_agent",
  "hub_staff",
  "admin",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("customer"),
  phone: text("phone"),
  hubId: uuid("hub_id").references((): any => hubs.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Logistics domain
// ---------------------------------------------------------------------------

export const shipmentStatusEnum = pgEnum("shipment_status", [
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
]);

export const packageTypeEnum = pgEnum("package_type", [
  "standard",
  "fragile",
  "medical",
  "express",
]);

export const priorityEnum = pgEnum("priority", ["normal", "high", "critical"]);

export const hubs = pgTable("hubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  addressLine: text("address_line").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  capacity: integer("capacity").notNull().default(500),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "bike",
  "van",
  "truck",
  "ev_bike",
  "ev_van",
]);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  registrationNumber: text("registration_number").notNull().unique(),
  type: vehicleTypeEnum("type").notNull(),
  capacityKg: doublePrecision("capacity_kg").notNull(),
  fuelEfficiency: doublePrecision("fuel_efficiency"),
  isElectric: boolean("is_electric").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackingId: text("tracking_id").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id),

    senderName: text("sender_name").notNull(),
    senderPhone: text("sender_phone").notNull(),
    senderAddressLine: text("sender_address_line").notNull(),
    senderCity: text("sender_city").notNull(),
    senderState: text("sender_state").notNull(),
    senderPincode: text("sender_pincode").notNull(),
    senderLat: doublePrecision("sender_lat"),
    senderLng: doublePrecision("sender_lng"),

    receiverName: text("receiver_name").notNull(),
    receiverPhone: text("receiver_phone").notNull(),
    receiverAddressLine: text("receiver_address_line").notNull(),
    receiverCity: text("receiver_city").notNull(),
    receiverState: text("receiver_state").notNull(),
    receiverPincode: text("receiver_pincode").notNull(),
    receiverLat: doublePrecision("receiver_lat"),
    receiverLng: doublePrecision("receiver_lng"),

    weightKg: doublePrecision("weight_kg").notNull(),
    packageType: packageTypeEnum("package_type").notNull().default("standard"),
    priority: priorityEnum("priority").notNull().default("normal"),
    insured: boolean("insured").notNull().default(false),
    declaredValue: doublePrecision("declared_value"),

    cost: doublePrecision("cost").notNull(),

    status: shipmentStatusEnum("status").notNull().default("booked"),
    originHubId: uuid("origin_hub_id").references(() => hubs.id),
    currentHubId: uuid("current_hub_id").references(() => hubs.id),
    destinationHubId: uuid("destination_hub_id").references(() => hubs.id),
    assignedAgentId: text("assigned_agent_id").references(() => user.id),
    assignedVehicleId: uuid("assigned_vehicle_id").references(() => vehicles.id),

    estimatedDeliveryAt: timestamp("estimated_delivery_at"),
    deliveredAt: timestamp("delivered_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("shipments_customer_idx").on(table.customerId),
    index("shipments_status_idx").on(table.status),
    index("shipments_agent_idx").on(table.assignedAgentId),
  ],
);

// Append-only audit trail backing the tracking timeline UI.
export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    status: shipmentStatusEnum("status").notNull(),
    location: text("location"),
    note: text("note"),
    actorUserId: text("actor_user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("shipment_events_shipment_idx").on(table.shipmentId)],
);

export const deliveryAttemptOutcomeEnum = pgEnum("delivery_attempt_outcome", [
  "delivered",
  "receiver_unavailable",
  "address_issue",
  "refused",
  "rescheduled",
  "returned",
]);

export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .notNull()
      .references(() => user.id),
    attemptNumber: integer("attempt_number").notNull(),
    outcome: deliveryAttemptOutcomeEnum("outcome").notNull(),
    reason: text("reason"),
    otpVerified: boolean("otp_verified").notNull().default(false),
    signatureUrl: text("signature_url"),
    photoUrl: text("photo_url"),
    attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
  },
  (table) => [index("delivery_attempts_shipment_idx").on(table.shipmentId)],
);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  method: text("method").notNull().default("mock"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transactionRef: text("transaction_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "shipment_booked",
  "payment_successful",
  "agent_assigned",
  "shipment_delayed",
  "medical_priority",
  "delivery_failed",
  "agent_changed",
  "delivered",
  "route_changed",
  "hub_transferred",
  "exception_alert",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("notifications_user_idx").on(table.userId)],
);

export const exceptionSeverityEnum = pgEnum("exception_severity", [
  "info",
  "warning",
  "critical",
]);

export const exceptionTypeEnum = pgEnum("exception_type", [
  "stationary_too_long",
  "repeated_failed_delivery",
  "delayed_beyond_threshold",
  "hub_congestion",
  "vehicle_overload",
  "route_deviation",
]);

// Drives SRS REQ-7.4 (proactive admin alerts).
export const exceptions = pgTable(
  "exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "cascade" }),
    hubId: uuid("hub_id").references(() => hubs.id, { onDelete: "cascade" }),
    type: exceptionTypeEnum("type").notNull(),
    severity: exceptionSeverityEnum("severity").notNull(),
    message: text("message").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    resolvedByUserId: text("resolved_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [index("exceptions_shipment_idx").on(table.shipmentId)],
);

// ---------------------------------------------------------------------------
// Relations (for Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const usersRelations = relations(user, ({ many, one }) => ({
  shipments: many(shipments, { relationName: "customerShipments" }),
  assignedShipments: many(shipments, { relationName: "agentShipments" }),
  addresses: many(addresses),
  notifications: many(notifications),
  hub: one(hubs, { fields: [user.hubId], references: [hubs.id] }),
}));

export const hubsRelations = relations(hubs, ({ many }) => ({
  vehicles: many(vehicles),
  staff: many(user),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  customer: one(user, {
    fields: [shipments.customerId],
    references: [user.id],
    relationName: "customerShipments",
  }),
  assignedAgent: one(user, {
    fields: [shipments.assignedAgentId],
    references: [user.id],
    relationName: "agentShipments",
  }),
  originHub: one(hubs, { fields: [shipments.originHubId], references: [hubs.id] }),
  currentHub: one(hubs, { fields: [shipments.currentHubId], references: [hubs.id] }),
  destinationHub: one(hubs, { fields: [shipments.destinationHubId], references: [hubs.id] }),
  vehicle: one(vehicles, { fields: [shipments.assignedVehicleId], references: [vehicles.id] }),
  events: many(shipmentEvents),
  attempts: many(deliveryAttempts),
  payments: many(payments),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentEvents.shipmentId], references: [shipments.id] }),
  actor: one(user, { fields: [shipmentEvents.actorUserId], references: [user.id] }),
}));

export const deliveryAttemptsRelations = relations(deliveryAttempts, ({ one }) => ({
  shipment: one(shipments, { fields: [deliveryAttempts.shipmentId], references: [shipments.id] }),
  agent: one(user, { fields: [deliveryAttempts.agentId], references: [user.id] }),
}));
