import "dotenv/config";
import postgres from "postgres";
import { randomUUID } from "crypto";
import { auth } from "../src/lib/auth.ts";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const DEMO_PASSWORD = "shiplync-demo-2026";

async function upsertUser({ email, name, role, phone, hubId }) {
  const existing = await sql`select id from "user" where email = ${email} limit 1`;
  let userId;
  if (existing.length) {
    userId = existing[0].id;
  } else {
    const result = await auth.api.signUpEmail({ body: { email, password: DEMO_PASSWORD, name } });
    userId = result.user.id;
  }
  await sql`update "user" set role = ${role}, phone = ${phone}, hub_id = ${hubId ?? null} where id = ${userId}`;
  return userId;
}

async function upsertHub({ name, code, addressLine, city, state, pincode, lat, lng, capacity }) {
  const existing = await sql`select id from hubs where code = ${code} limit 1`;
  if (existing.length) return existing[0].id;
  const id = randomUUID();
  await sql`
    insert into hubs (id, name, code, address_line, city, state, pincode, lat, lng, capacity, created_at)
    values (${id}, ${name}, ${code}, ${addressLine}, ${city}, ${state}, ${pincode}, ${lat}, ${lng}, ${capacity}, now())
  `;
  return id;
}

async function upsertVehicle({ hubId, registrationNumber, type, capacityKg, isElectric }) {
  const existing = await sql`select id from vehicles where registration_number = ${registrationNumber} limit 1`;
  if (existing.length) return existing[0].id;
  const id = randomUUID();
  await sql`
    insert into vehicles (id, hub_id, registration_number, type, capacity_kg, is_electric, active, created_at)
    values (${id}, ${hubId}, ${registrationNumber}, ${type}, ${capacityKg}, ${isElectric}, true, now())
  `;
  return id;
}

const bomHubId = await upsertHub({
  name: "Regional Hub 2",
  code: "HUB-02",
  addressLine: "Regional Logistics Hub",
  city: "Hub",
  state: "MH",
  pincode: "400069",
  lat: 19.1136,
  lng: 72.8697,
  capacity: 800,
});

const blrHubId = await upsertHub({
  name: "Central Hub",
  code: "HUB-01",
  addressLine: "Central Logistics Center",
  city: "Hub",
  state: "KA",
  pincode: "560066",
  lat: 12.9698,
  lng: 77.75,
  capacity: 600,
});

await upsertVehicle({ hubId: bomHubId, registrationNumber: "MH-02-EV-2210", type: "ev_van", capacityKg: 250, isElectric: true });
await upsertVehicle({ hubId: blrHubId, registrationNumber: "KA-05-EV-3311", type: "ev_bike", capacityKg: 25, isElectric: true });

const customerId = await upsertUser({
  email: "customer1@shiplync.test",
  name: "Demo Customer",
  role: "customer",
  phone: "+91 90000 00001",
  hubId: null,
});

const agentId = await upsertUser({
  email: "agent1@shiplync.test",
  name: "Ravi Kumar",
  role: "delivery_agent",
  phone: "+91 90000 10001",
  hubId: blrHubId,
});

const hubStaffId = await upsertUser({
  email: "hub1@shiplync.test",
  name: "Priya R.",
  role: "hub_staff",
  phone: "+91 90000 20001",
  hubId: blrHubId,
});

const adminId = await upsertUser({
  email: "admin1@shiplync.test",
  name: "Ops Admin",
  role: "admin",
  phone: "+91 90000 30001",
  hubId: null,
});

console.log("Seeded:");
console.log({ bomHubId, blrHubId, customerId, agentId, hubStaffId, adminId });
console.log(`All demo accounts use password: ${DEMO_PASSWORD}`);

await sql.end();
process.exit(0);
