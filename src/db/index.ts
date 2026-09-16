import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dns from "node:dns";
import * as schema from "./schema.ts";

// Fix for Node.js trying IPv6 before IPv4 when connecting to cloud database endpoints
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignored in environments where not supported
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// Supabase transaction pooler (pgBouncer on port 6543) requires:
// 1. prepare: false (pgBouncer transaction mode cannot reuse prepared statements)
// 2. idle_timeout & keep_alive to prevent stale/dead socket reuse after pooler drops idle TCP connections
// 3. connect_timeout to fail fast and retry rather than hanging indefinitely on ETIMEDOUT
const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 15,
  max_lifetime: 60 * 15,
  max: 10,
  keep_alive: 10,
});

export const db = drizzle(client, { schema });
