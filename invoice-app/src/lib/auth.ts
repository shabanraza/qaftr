import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { bearer } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:9000",
  trustedOrigins: [
    "http://localhost:9000",
    "http://localhost:8081",
    "exp://",
    "qaftr://",
  ],
  advanced: {
    // Mobile and Expo web clients don't always send Origin / Sec-Fetch headers.
    disableCSRFCheck: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    tanstackStartCookies(),
    // bearer() lets the mobile app send Authorization: Bearer <token>
    bearer(),
  ],
});
