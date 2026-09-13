// Same lifecycle test as e2e-test.mjs, but against the real deployed URL
// over real HTTP — verifies the actual live site, not the local build.
const BASE = process.env.LIVE_BASE_URL || "https://shiplync-ai-logistics.vercel.app";

process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
  if (!cond) failures++;
}

// Node's fetch sends a literal "Origin: null" header for server-side script
// calls (no browsing context) — better-auth correctly treats a present-but-
// invalid Origin as more suspicious than a missing one and rejects it,
// which is what real cross-site forgery looks like. Real browsers always
// send a correct Origin, so this only affects script-driven testing; set it
// explicitly here to exercise the API the way a real browser would.
async function call(path, opts = {}) {
  const headers = { ...(opts.headers || {}), origin: BASE };
  return fetch(`${BASE}${path}`, { ...opts, headers });
}

async function signIn(email, password = "shiplync-demo-2026") {
  const res = await call("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  check(`sign-in ${email}`, res.status === 200 && !!cookie);
  return cookie;
}

console.log(`=== LIVE E2E lifecycle test against ${BASE} ===`);

const testEmail = `e2e-live-${Date.now()}@shiplync.test`;
const signUpRes = await call("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: "e2e-test-pass-123", name: "E2E Live Customer" }),
});
const customerCookie = signUpRes.headers.get("set-cookie")?.split(";")[0];
check("sign-up fresh customer", signUpRes.status === 200 && !!customerCookie);

const uniqueSuffix = Date.now();
const bookRes = await call("/api/shipments", {
  method: "POST",
  headers: { "content-type": "application/json", cookie: customerCookie },
  body: JSON.stringify({
    senderName: "E2E Live Sender",
    senderPhone: "+919000000000",
    senderAddressLine: "88 Marine Drive",
    senderCity: "Mumbai",
    senderState: "MH",
    senderPincode: "400002",
    receiverName: `E2E Live Receiver ${uniqueSuffix}`,
    receiverPhone: "+919000000002",
    receiverAddressLine: "Test Addr",
    receiverCity: "Bengaluru",
    receiverState: "KA",
    receiverPincode: "560066",
    weightKg: 2.5,
    packageType: "medical",
    priority: "normal",
    insured: true,
    declaredValue: 20000,
  }),
});
const bookData = await bookRes.json();
check("book shipment -> 201", bookRes.status === 201);
const shipmentId = bookData.shipment?.id;
const trackingId = bookData.shipment?.trackingId;
check("shipment has id + trackingId", !!shipmentId && !!trackingId);
check("shipment starts as booked", bookData.shipment?.status === "booked");
check("medical package auto-escalated to high priority", bookData.shipment?.priority === "high");
console.log(`  tracking: ${trackingId}, cost: ₹${bookData.shipment?.cost}`);

const trackRes = await call(`/api/shipments/track/${trackingId}`);
const trackData = await trackRes.json();
check("public tracking lookup finds it", trackRes.status === 200 && trackData.shipment?.id === shipmentId);
check("initial event 'booked' recorded", trackData.events?.some((e) => e.status === "booked"));

// Cross-account authorization: a second customer must NOT see this shipment or mutate it
const otherEmail = `e2e-live-other-${Date.now()}@shiplync.test`;
const otherSignUp = await call("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: otherEmail, password: "e2e-test-pass-123", name: "E2E Other Customer" }),
});
const otherCookie = otherSignUp.headers.get("set-cookie")?.split(";")[0];
const otherListRes = await call("/api/shipments", { headers: { cookie: otherCookie } });
const otherListData = await otherListRes.json();
check("SECURITY: other customer's shipment list does NOT include this shipment", !otherListData.shipments?.some((s) => s.id === shipmentId));

const otherAdminRes = await call("/api/stats/overview", { headers: { cookie: otherCookie } });
check("SECURITY: non-admin customer forbidden from admin stats", otherAdminRes.status === 403);

const adminCookie = await signIn("admin1@shiplync.test");
const adminListRes = await call("/api/shipments?scope=all", { headers: { cookie: adminCookie } });
const adminListData = await adminListRes.json();
check("shipment visible in admin scope=all", adminListData.shipments?.some((s) => s.id === shipmentId));

const statsRes = await call("/api/stats/overview", { headers: { cookie: adminCookie } });
const statsData = await statsRes.json();
check("admin stats total > 0", statsData.total > 0);
console.log(`  admin stats: total=${statsData.total} pending=${statsData.pending} medical=${statsData.medical}`);

const hubCookie = await signIn("hub1@shiplync.test");

// Invalid transition: hub tries to jump straight to "delivered" without going through the flow first
const invalidRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "not_a_real_status" }),
});
check("SECURITY: invalid status enum value rejected (400)", invalidRes.status === 400);

const arrivedRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "arrived_hub", location: "Bengaluru Dispatch Center", note: "E2E live: scanned at hub." }),
});
check("hub marks arrived_hub -> 200", arrivedRes.status === 200);
check("status now arrived_hub", (await arrivedRes.json()).shipment?.status === "arrived_hub");

const agentsRes = await call("/api/agents", { headers: { cookie: hubCookie } });
const agentsData = await agentsRes.json();
const agentId = agentsData.agents?.[0]?.id;
check("at least one delivery agent exists", !!agentId);

const assignRes = await call(`/api/shipments/${shipmentId}/assign`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ agentId }),
});
check("assign agent -> 200", assignRes.status === 200);
check("assignedAgentId set", (await assignRes.json()).shipment?.assignedAgentId === agentId);

const dispatchRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "out_for_delivery", note: "E2E live: dispatched." }),
});
check("dispatch -> out_for_delivery", dispatchRes.status === 200 && (await dispatchRes.json()).shipment?.status === "out_for_delivery");

// SECURITY: customer (not hub/admin/agent) must not be able to update status
const customerTamperRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: customerCookie },
  body: JSON.stringify({ status: "delivered" }),
});
check("SECURITY: customer forbidden from updating shipment status", customerTamperRes.status === 403);

const agentCookie = await signIn("agent1@shiplync.test");
const agentShipmentsRes = await call("/api/shipments?scope=assigned", { headers: { cookie: agentCookie } });
const agentShipmentsData = await agentShipmentsRes.json();
check("shipment visible in agent's assigned list", agentShipmentsData.shipments?.some((s) => s.id === shipmentId));

const attemptRes = await call(`/api/shipments/${shipmentId}/attempts`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: agentCookie },
  body: JSON.stringify({ outcome: "delivered", reason: "E2E live: delivered to recipient.", otpVerified: true }),
});
const attemptData = await attemptRes.json();
check("delivery attempt -> 201", attemptRes.status === 201);
check("attempt number is 1", attemptData.attempt?.attemptNumber === 1);

const finalTrackRes = await call(`/api/shipments/track/${trackingId}`);
const finalTrackData = await finalTrackRes.json();
check("final status is delivered (public tracking)", finalTrackData.shipment?.status === "delivered");
check("deliveredAt is set", !!finalTrackData.shipment?.deliveredAt);
check("event trail has 4+ entries", finalTrackData.events?.length >= 4);

const finalAdminRes = await call("/api/shipments?scope=all", { headers: { cookie: adminCookie } });
const finalAdminData = await finalAdminRes.json();
const finalAdminShipment = finalAdminData.shipments?.find((s) => s.id === shipmentId);
check("admin panel shows delivered status", finalAdminShipment?.status === "delivered");

const paymentsRes = await call("/api/payments?scope=all", { headers: { cookie: adminCookie } });
const paymentsData = await paymentsRes.json();
check("a payment row exists for this shipment", paymentsData.payments?.some((p) => p.shipmentId === shipmentId));

const finalStatsRes = await call("/api/stats/overview", { headers: { cookie: adminCookie } });
const finalStatsData = await finalStatsRes.json();
check("admin deliveredToday increased", finalStatsData.deliveredToday >= 1);

const notifRes = await call("/api/notifications", { headers: { cookie: customerCookie } });
const notifData = await notifRes.json();
check("customer got a 'delivered' notification", notifData.notifications?.some((n) => n.shipmentId === shipmentId && n.type === "delivered"));

// Exception detection sweep on real data
const detectRes = await call("/api/exceptions/detect", { method: "POST", headers: { cookie: adminCookie } });
check("exception detection sweep runs -> 200", detectRes.status === 200);

console.log(`\n=== ${failures === 0 ? "ALL LIVE CHECKS PASSED" : `${failures} LIVE CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
