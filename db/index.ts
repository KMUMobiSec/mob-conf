import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: PostgresClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

export const dbClient =
  globalForDb.postgresClient ??
  postgres(databaseUrl, {
    prepare: false,
    // Supabase's session-mode pooler caps the whole project at 15 concurrent connections.
    // Each serverless instance gets its own client, so keep per-instance usage minimal and
    // release connections quickly instead of holding them open for the lifetime of the instance.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

globalForDb.postgresClient = dbClient;

export const db = drizzle(dbClient, { schema });

export function closeDb() {
  return dbClient.end();
}
