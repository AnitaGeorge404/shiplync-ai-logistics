import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`
  ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS elderly_care boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS pickup_date timestamp
`;

console.log("Migration applied: elderly_care, pickup_date columns added to shipments.");
await sql.end();
