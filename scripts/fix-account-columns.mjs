import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`
  ALTER TABLE "account"
    ADD COLUMN IF NOT EXISTS "access_token" text,
    ADD COLUMN IF NOT EXISTS "refresh_token" text,
    ADD COLUMN IF NOT EXISTS "id_token" text,
    ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp,
    ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp,
    ADD COLUMN IF NOT EXISTS "scope" text
`;

await sql`
  ALTER TABLE "verification"
    ADD COLUMN IF NOT EXISTS "updated_at" timestamp
`;

console.log("account/verification columns are up to date.");
await sql.end();
