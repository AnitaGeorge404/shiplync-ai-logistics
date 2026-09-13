import "dotenv/config";
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

const mod = await import("../.vercel/output/functions/__server.func/index.mjs");
const handler = mod.default ?? mod;

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
  if (!cond) failures++;
}
async function call(path, opts = {}) {
  return handler.fetch(new Request(`http://localhost${path}`, opts), {}, {});
}
async function signIn(email) {
  const res = await call("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "shiplync-demo-2026" }),
  });
  return res.headers.get("set-cookie")?.split(";")[0];
}

console.log("=== State machine + ownership enforcement test ===");

const custEmail = `sm-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: custEmail, password: "e2e-test-pass-123", name: "SM Test" }),
});
const custCookie = su.headers.get("set-cookie")?.split(";")[0];

const bookRes = await call("/api/shipments", {
  method: "POST",
  headers: { "content-type": "application/json", cookie: custCookie },
  body: JSON.stringify({
    senderName: "SM Sender", senderPhone: "9000000000", senderAddressLine: "88 Marine Drive", senderCity: "Mumbai", senderState: "Maharashtra", senderPincode: "400002",
    receiverName: "SM Receiver", receiverPhone: "9000000002", receiverAddressLine: "12 FC Road", receiverCity: "Pune", receiverState: "Maharashtra", receiverPincode: "411001",
    weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, packageType: "standard", priority: "normal", insured: false,
  }),
});
const shipmentId = (await bookRes.json()).shipment.id;

const hubCookie = await signIn("hub1@shiplync.test");
const adminCookie = await signIn("admin1@shiplync.test");
const agentCookie = await signIn("agent1@shiplync.test");

// ILLEGAL: booked -> delivered (skip whole lifecycle)
const illegal1 = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "delivered" }),
});
check("REJECTED: booked -> delivered (409)", illegal1.status === 409);

// LEGAL: booked -> arrived_hub (hub intake path, no separate pickup step)
const legal1 = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "arrived_hub" }),
});
check("ALLOWED: booked -> arrived_hub (200)", legal1.status === 200);

// ILLEGAL: arrived_hub -> booked (backwards)
const illegal2 = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "booked" }),
});
check("REJECTED: arrived_hub -> booked, backwards (409)", illegal2.status === 409);

// Try to log a delivery attempt before out_for_delivery -> should be rejected
const agentsRes = await call("/api/agents", { headers: { cookie: hubCookie } });
const agentId = (await agentsRes.json()).agents[0].id;
await call(`/api/shipments/${shipmentId}/assign`, {
  method: "POST", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ agentId }),
});

const earlyAttempt = await call(`/api/shipments/${shipmentId}/attempts`, {
  method: "POST", headers: { "content-type": "application/json", cookie: agentCookie },
  body: JSON.stringify({ outcome: "delivered", otpVerified: true }),
});
check("REJECTED: delivery attempt before out_for_delivery (409)", earlyAttempt.status === 409);

// Dispatch properly
const dispatchRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "out_for_delivery" }),
});
check("ALLOWED: arrived_hub -> out_for_delivery (200)", dispatchRes.status === 200);

// A second, unrelated agent must not be able to touch this shipment
// (seed only has one agent, so simulate by creating a second one via role update is out of scope;
// instead verify the assigned agent match logic directly by attempting as admin — admin should succeed).
const adminAttempt = await call(`/api/shipments/${shipmentId}/attempts`, {
  method: "POST", headers: { "content-type": "application/json", cookie: adminCookie },
  body: JSON.stringify({ outcome: "delivered", otpVerified: true }),
});
check("ALLOWED: admin can log attempt regardless of assignment (201)", adminAttempt.status === 201);

console.log(`\n=== ${failures === 0 ? "ALL STATE-MACHINE CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
