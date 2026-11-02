import type { auth } from "@/lib/auth";

/**
 * Auth-specific shared TypeScript types.
 *
 * These are inferred from the server Better Auth instance with `import type`,
 * so the typecheck sees the exact shape of user and session records while the
 * client bundle stays free of any server-side module.
 */

/** A signed-in session, exactly as returned by Better Auth. */
export type AuthSession = typeof auth.$Infer.Session;

/** The user document attached to a session. */
export type AuthUser = AuthSession["user"];
