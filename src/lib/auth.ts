import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:5173",
    // Vercel injects VERCEL_URL (host only, no scheme) for every
    // deployment — production and preview alike — so this covers each
    // preview/unique-deployment URL automatically without hardcoding
    // hashes that change on every deploy. VERCEL_PROJECT_PRODUCTION_URL
    // is the assigned "clean" production alias, which VERCEL_URL does
    // NOT always equal (this is what actually broke login in prod —
    // requests came from shiplync-ai-logistics.vercel.app, which wasn't
    // covered by either the hash URL or the git-main branch alias below).
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // Stable, hardcoded fallbacks (kept even if the env vars above are
    // ever unset, and to cover custom domains you attach later — add
    // those here too).
    "https://shiplync-ai-logistics.vercel.app",
    "https://shiplync-ai-logistics-git-main-anita-georges-projects.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      hubId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
