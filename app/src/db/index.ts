import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// Reuse a single pool across hot-reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var __cadencePg: ReturnType<typeof postgres> | undefined;
}

const client = global.__cadencePg ?? postgres(connectionString, { max: 5 });
if (process.env.NODE_ENV !== "production") global.__cadencePg = client;

export const db = drizzle(client, { schema });
export { schema };
