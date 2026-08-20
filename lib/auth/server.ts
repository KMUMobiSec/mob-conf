import "server-only";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { createAuthOptions } from "@/lib/auth/config";

const authOptions = createAuthOptions({ disableSignUp: true });

export const auth = betterAuth({
  ...authOptions,
  plugins: [...authOptions.plugins, nextCookies()],
});
