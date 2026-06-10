import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Reuse HTTP connections in dev — reduces "Network connection lost" flakes. */
neonConfig.fetchConnectionCache = true;

const MAX_FETCH_RETRIES = 3;

neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(input, init);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_FETCH_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
