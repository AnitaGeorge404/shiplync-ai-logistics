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
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "shiplync-demo-2026" }),
  });
  return res.headers.get("set-cookie")?.split(";")[0];
}
async function bookAndDispatch(custCookie, hubCookie, agentCookie) {
  const bookRes = await call("/api/shipments", {
    method: "POST", headers: { "content-type": "application/json", cookie: custCookie },
    body: JSON.stringify({
      senderName: "Reschedule Sender", senderPhone: "9000000000", senderAddressLine: "88 Marine Drive", senderCity: "Mumbai", senderState: "Maharashtra", senderPincode: "400002",
      receiverName: "Reschedule Receiver", receiverPhone: "9000000002", receiverAddressLine: "12 FC Road", receiverCity: "Pune", receiverState: "Maharashtra", receiverPincode: "411001",
      weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, packageType: "standard", priority: "normal", insured: false,
    }),
  });
  const shipmentId = (await bookRes.json()).shipment.id;
  await call(`/api/shipments/${shipmentId}/status`, {
    method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
    body: JSON.stringify({ status: "arrived_hub" }),
  });
  const agentsRes = await call("/api/agents", { headers: { cookie: hubCookie } });
  const agentId = (await agentsRes.json()).agents[0].id;
  await call(`/api/shipments/${shipmentId}/assign`, {
    method: "POST", headers: { "content-type": "application/json", cookie: hubCookie },
    body: JSON.stringify({ agentId }),
  });
  await call(`/api/shipments/${shipmentId}/status`, {
    method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
    body: JSON.stringify({ status: "out_for_delivery" }),
  });
  await call(`/api/shipments/${shipmentId}/attempts`, {
    method: "POST", headers: { "content-type": "application/json", cookie: agentCookie },
    body: JSON.stringify({ outcome: "receiver_unavailable", reason: "No one home." }),
  });
  return shipmentId;
}

console.log("=== Failed-delivery -> reschedule -> delivered, and failed-delivery -> return-to-sender (REQ-6.2, REQ-6.3) ===");

const custEmail = `resched-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: custEmail, password: "e2e-test-pass-123", name: "Resched Test" }),
});
const custCookie = su.headers.get("set-cookie")?.split(";")[0];
const hubCookie = await signIn("hub1@shiplync.test");
const agentCookie = await signIn("agent1@shiplync.test");

// Scenario 1: failed attempt -> reschedule (redispatch) -> delivered.
const shipment1 = await bookAndDispatch(custCookie, hubCookie, agentCookie);
const [check1] = await (await call(`/api/shipments?scope=hub`, { headers: { cookie: hubCookie } })).json().then((d) => d.shipments.filter((s) => s.id === shipment1));
check("shipment is at delivery_attempted after failed attempt", check1?.status === "delivery_attempted");

const rescheduleRes = await call(`/api/shipments/${shipment1}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "out_for_delivery", note: "Rescheduled for redelivery from hub." }),
});
check("hub reschedules failed delivery -> out_for_delivery (200, was previously a dead end with no UI action)", rescheduleRes.status === 200);

const deliverRes = await call(`/api/shipments/${shipment1}/attempts`, {
  method: "POST", headers: { "content-type": "application/json", cookie: agentCookie },
  body: JSON.stringify({ outcome: "delivered", otpVerified: true }),
});
check("second attempt succeeds -> delivered (201)", deliverRes.status === 201);

const finalShip1 = await (await call(`/api/shipments`, { headers: { cookie: custCookie } })).json();
const s1 = finalShip1.shipments?.find((s) => s.id === shipment1);
check("customer view shows final status 'delivered' after reschedule", s1?.status === "delivered");

// Scenario 2: failed attempt -> return to sender.
const shipment2 = await bookAndDispatch(custCookie, hubCookie, agentCookie);
const returnRes = await call(`/api/shipments/${shipment2}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "returned", note: "Returned to sender after failed delivery." }),
});
check("hub marks failed delivery as returned-to-sender (200, was previously a dead end with no UI action)", returnRes.status === 200);

const finalShip2 = await (await call(`/api/shipments`, { headers: { cookie: custCookie } })).json();
const s2 = finalShip2.shipments?.find((s) => s.id === shipment2);
check("customer view shows final status 'returned'", s2?.status === "returned");

const returnsPage = await (await call(`/api/shipments`, { headers: { cookie: custCookie } })).json();
check("returned shipment appears in customer's shipment list", returnsPage.shipments?.some((s) => s.id === shipment2 && s.status === "returned"));

// Illegal: a delivered/returned shipment must not accept any further transition.
const illegalAfterReturn = await call(`/api/shipments/${shipment2}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "out_for_delivery" }),
});
check("REJECTED: cannot transition out of terminal 'returned' state (409)", illegalAfterReturn.status === 409);

console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
