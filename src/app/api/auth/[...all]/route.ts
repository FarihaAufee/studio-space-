import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Mounts the Better Auth API at /api/auth/*.
 *
 * This exposes every auth endpoint (sign-up, sign-in, sign-out, social
 * callbacks, session) under a single catch-all route.
 */
export const { GET, POST } = toNextJsHandler(auth);
