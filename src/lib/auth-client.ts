import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/**
 * Reusable Better Auth client for the browser (React bindings).
 *
 * `inferAdditionalFields` is a type-only plugin that mirrors the server auth
 * configuration (including profile `additionalFields`) so `useSession()`,
 * `updateUser()` and friends are fully typed without importing any
 * server-side code into the client bundle.
 *
 * The auth API lives on the same Next.js server at /api/auth, so the base URL
 * is optional. Set NEXT_PUBLIC_BETTER_AUTH_URL only if authentication is
 * served from a different origin.
 */





export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
