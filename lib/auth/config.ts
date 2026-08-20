import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/schema";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function authBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

function trustedOrigins() {
  return [process.env.NEXT_PUBLIC_BASE_URL, process.env.BETTER_AUTH_URL]
    .filter((origin): origin is string => Boolean(origin))
    .filter((origin, index, origins) => origins.indexOf(origin) === index);
}

export function createAuthOptions({ disableSignUp = true }: { disableSignUp?: boolean } = {}) {
  return {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    secret: requireEnv("BETTER_AUTH_SECRET"),
    baseURL: authBaseUrl(),
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
      disableSignUp,
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
    ],
  };
}
