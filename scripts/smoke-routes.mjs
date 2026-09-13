import "dotenv/config";

process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

const mod = await import("../.vercel/output/functions/__server.func/index.mjs");
const handler = mod.default ?? mod;

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

const routes = {
  customer: ["/customer", "/customer/book", "/customer/track", "/customer/shipments", "/customer/addresses", "/customer/payments", "/customer/invoices", "/customer/returns", "/customer/notifications", "/customer/support"],
  hub: ["/hub", "/hub/dispatch", "/hub/intake", "/hub/exceptions", "/hub/load", "/hub/medical", "/hub/analytics"],
  agent: ["/driver", "/driver/my-route", "/driver/deliveries", "/driver/earnings", "/driver/performance", "/driver/exceptions"],
  admin: ["/admin", "/admin/fleet", "/admin/hubs", "/admin/users", "/admin/payments", "/admin/reports", "/admin/map", "/admin/settings", "/admin/exceptions", "/admin/notifications"],
};

const emails = {
  customer: "agent1@shiplync.test", // placeholder, overwritten below with a real customer
  hub: "hub1@shiplync.test",
  agent: "agent1@shiplync.test",
  admin: "admin1@shiplync.test",
};

// Sign up a throwaway customer for the customer portal
const custEmail = `smoke.${Date.now()}@shiplync.test`;
await call("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: custEmail, password: "shiplync-demo-2026", name: "Smoke Test" }),
});

const cookies = {
  customer: await signIn(custEmail),
  hub: await signIn(emails.hub),
  agent: await signIn(emails.agent),
  admin: await signIn(emails.admin),
};

let fails = 0;
for (const [role, paths] of Object.entries(routes)) {
  for (const p of paths) {
    const res = await call(p, { headers: { cookie: cookies[role] } });
    const ok = res.status === 200;
    if (!ok) fails++;
    console.log(`${ok ? "OK  " : "FAIL"} [${role}] ${p} -> ${res.status}`);
  }
}

console.log(fails === 0 ? "\n=== ALL ROUTES OK ===" : `\n=== ${fails} ROUTE(S) FAILED ===`);
process.exit(fails === 0 ? 0 : 1);
