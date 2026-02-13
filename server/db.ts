import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

// In production, fail fast if DATABASE_URL is missing — the app cannot function without it.
// In dev, warn but allow startup so non-DB features can still be tested.
if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌  FATAL: DATABASE_URL is not set. Cannot start in production without a database.");
    console.error("    Railway: Add a PostgreSQL database service and link it to your app service.");
    console.error("    The DATABASE_URL variable will be injected automatically once connected.");
    process.exit(1);
  } else {
    console.warn("⚠️  DATABASE_URL is not set. Database operations will fail.");
    console.warn("    To fix this, set the DATABASE_URL environment variable:");
    console.warn("    - For local development: Set DATABASE_URL in your .env file");
    console.warn("    - Format: postgresql://user:password@host:port/database");
  }
}

// Create client - will throw error on first use if DATABASE_URL is not set
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!_client) {
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is not configured. Please set the DATABASE_URL environment variable to connect to a PostgreSQL database."
      );
    }
    _client = postgres(databaseUrl);
  }
  return _client;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// Export getters that lazily initialize the connection
export const client = new Proxy({} as ReturnType<typeof postgres>, {
  get: (target, prop) => {
    return getClient()[prop as keyof ReturnType<typeof postgres>];
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
