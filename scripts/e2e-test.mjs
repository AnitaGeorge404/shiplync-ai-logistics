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

console.log("=== E2E lifecycle test ===");

// 1. Sign up a fresh customer account (avoids depending on prior test state)
const testEmail = `e2e-${Date.now()}@shiplync.test`;
const signUpRes = await call("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: "e2e-test-pass-123", name: "E2E Test Customer" }),
});
const customerCookie = signUpRes.headers.get("set-cookie")?.split(";")[0];
check("sign-up fresh customer", signUpRes.status === 200 && !!customerCookie);

const uniqueSuffix = Date.now();
const bookRes = await call("/api/shipments", {
  method: "POST",
  headers: { "content-type": "application/json", cookie: customerCookie },
  body: JSON.stringify({
    senderName: "E2E Sender",
    senderPhone: "+919000000000",
    senderAddressLine: "88 Marine Drive",
    senderCity: "Mumbai",
    senderState: "MH",
    senderPincode: "400002",
    receiverName: `E2E Receiver ${uniqueSuffix}`,
    receiverPhone: "+919000000002",
    receiverAddressLine: "Test Addr",
    receiverCity: "Bengaluru",
    receiverState: "KA",
    receiverPincode: "560066",
    weightKg: 2.5,
    packageType: "express",
    priority: "normal",
    insured: false,
  }),
});
const bookData = await bookRes.json();
check("book shipment -> 201", bookRes.status === 201);
const shipmentId = bookData.shipment?.id;
const trackingId = bookData.shipment?.trackingId;
check("shipment has id + trackingId", !!shipmentId && !!trackingId);
check("shipment starts as booked", bookData.shipment?.status === "booked");
console.log(`  tracking: ${trackingId}`);

// 2. Verify it's publicly trackable (proves DB persistence)
const trackRes = await call(`/api/shipments/track/${trackingId}`);
const trackData = await trackRes.json();
check("public tracking lookup finds it", trackRes.status === 200 && trackData.shipment?.id === shipmentId);
check("initial event 'booked' recorded", trackData.events?.some((e) => e.status === "booked"));

// 3. Verify it appears in the admin panel's full shipment list
const adminCookie = await signIn("admin1@shiplync.test");
const adminListRes = await call("/api/shipments?scope=all", { headers: { cookie: adminCookie } });
const adminListData = await adminListRes.json();
check("shipment visible in admin scope=all", adminListData.shipments?.some((s) => s.id === shipmentId));

const statsRes = await call("/api/stats/overview", { headers: { cookie: adminCookie } });
const statsData = await statsRes.json();
check("admin stats total > 0", statsData.total > 0);
console.log(`  admin stats: total=${statsData.total} pending=${statsData.pending}`);

// 4. Hub staff receives it: hub_staff manually assigns a hub via status update (arrived_hub)
const hubCookie = await signIn("hub1@shiplync.test");
const arrivedRes = await call(`/api/shipments/${shipmentId}/status`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "arrived_hub", location: "Bengaluru Dispatch Center", note: "E2E: scanned at hub." }),
});
check("hub marks arrived_hub -> 200", arrivedRes.status === 200);
check("status now arrived_hub", (await arrivedRes.json()).shipment?.status === "arrived_hub");

// 5. Hub assigns a delivery agent and dispatches
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
  body: JSON.stringify({ status: "out_for_delivery", note: "E2E: dispatched." }),
});
check("dispatch -> out_for_delivery", dispatchRes.status === 200 && (await dispatchRes.json()).shipment?.status === "out_for_delivery");

// 6. Verify it shows up in that agent's real assigned-shipments view
const agentCookie = await signIn("agent1@shiplync.test");
const agentShipmentsRes = await call("/api/shipments?scope=assigned", { headers: { cookie: agentCookie } });
const agentShipmentsData = await agentShipmentsRes.json();
check("shipment visible in agent's assigned list", agentShipmentsData.shipments?.some((s) => s.id === shipmentId));

// 7. Agent completes delivery with OTP-verified attempt
const attemptRes = await call(`/api/shipments/${shipmentId}/attempts`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: agentCookie },
  body: JSON.stringify({ outcome: "delivered", reason: "E2E: delivered to recipient.", otpVerified: true }),
});
const attemptData = await attemptRes.json();
check("delivery attempt -> 201", attemptRes.status === 201);
check("attempt number is 1", attemptData.attempt?.attemptNumber === 1);

// 8. Confirm final state everywhere: public tracking, DB via admin list, payments
const finalTrackRes = await call(`/api/shipments/track/${trackingId}`);
const finalTrackData = await finalTrackRes.json();
check("final status is delivered (public tracking)", finalTrackData.shipment?.status === "delivered");
check("deliveredAt is set", !!finalTrackData.shipment?.deliveredAt);
check("event trail has 4+ entries (booked, arrived_hub, out_for_delivery, delivered)", finalTrackData.events?.length >= 4);

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

// 9. Notifications: customer should have received booking + delivered notifications
const notifRes = await call("/api/notifications", { headers: { cookie: customerCookie } });
const notifData = await notifRes.json();
check("customer got a 'delivered' notification", notifData.notifications?.some((n) => n.shipmentId === shipmentId && n.type === "delivered"));

console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
