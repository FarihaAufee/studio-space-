import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import type { StudioRole } from "@/types/host";

/**
 * Server-side API plumbing shared by every route handler under /api.
 *
 * - Consistent JSON envelope: `{ success, message, data?, errors? }`
 * - Session/role helpers that derive identity ONLY from the verified
 *   Better Auth session cookie — request bodies, headers, and query
 *   parameters are never trusted for user id, role, or ownership.
 * - Correct HTTP status codes (200/201/400/401/403/404/409/500) and no
 *   stack traces or secrets in responses.
 */

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
}

export interface AuthContext {
  /** The verified Better Auth session user. */
  user: ApiUser;
  /** Raw role field as stored on the account (undefined on legacy users). */
  storedRole: string | undefined;
  /** Effective role: admin via env list or stored role, then host, then customer. */
  role: StudioRole;
  isHost: boolean;
  isAdmin: boolean;
}

/* ------------------------------------------------------------------ */
/* Response helpers                                                    */
/* ------------------------------------------------------------------ */

export function jsonOk(
  data: unknown,
  message = "Request completed successfully.",
  status: 200 | 201 = 200
): Response {
  return Response.json(
    { success: true, message, data },
    { status }
  );
}

export function jsonError(
  status:
    | 400
    | 401
    | 403
    | 404
    | 405
    | 409
    | 500
    | 502
    | 503,
  message: string,
  errors?: Record<string, string>
): Response {
  return Response.json(
    errors
      ? { success: false, message, errors }
      : { success: false, message },
    { status }
  );
}

/** Validation error — 400 with per-field messages (`{ email: "..." }`). */
export const validationError = (errors: Record<string, string>, message = "Please check the highlighted fields.") =>
  jsonError(400, message, errors);

/** Wraps handler bodies so unexpected errors become a clean 500. */
export async function handleRoute(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    // Framework control-flow digests (prerender aborts, dynamic bailouts)
    // must propagate so React/Next.js can terminate the render properly —
    // swallowing them would turn an intentional abort into a bogus 500.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      FRAMEWORK_DIGESTS.has((error as { digest: string }).digest)
    ) {
      throw error;
    }
    // Logged server-side only; the client never sees internals.
    console.error("[api] unexpected error:", error);
    return jsonError(500, "Something went wrong on our side. Please try again.");
  }
}

/** Next.js internal digests that are control flow, not failures. */
const FRAMEWORK_DIGESTS = new Set([
  "HANGING_PROMISE_REJECTION",
  "DYNAMIC_SERVER_USAGE",
  "BAILOUT_TO_CLIENT_SIDE_RENDERING",
]);

/* ------------------------------------------------------------------ */
/* Session + roles                                                     */
/* ------------------------------------------------------------------ */

/**
 * Reads the verified Better Auth session and derives the effective role.
 * Admin status comes from the ADMIN_EMAILS env list (see src/lib/admin.ts)
 * or a stored "admin" role — both are server-side only.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const raw = { ...session.user } as {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    image?: string | null;
    role?: string | null;
  };

  const storedRole =
    typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : undefined;
  const admin = isAdminEmail(raw.email) || storedRole === "admin";

  const role: StudioRole = admin
    ? "admin"
    : storedRole === "host"
      ? "host"
      : "customer";

  return {
    user: {
      id: raw.id,
      name: typeof raw.name === "string" ? raw.name : "",
      email: typeof raw.email === "string" ? raw.email : "",
      phone: typeof raw.phone === "string" ? raw.phone : "",
      image: typeof raw.image === "string" && raw.image.trim() ? raw.image : null,
    },
    storedRole,
    role,
    isHost: role === "host" || role === "admin",
    isAdmin: role === "admin",
  };
}

/** 401 when there is no valid session. */
export async function requireUser(): Promise<
  { ok: true; auth: AuthContext } | { ok: false; response: Response }
> {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      ok: false,
      response: jsonError(401, "Please sign in to continue."),
    };
  }
  return { ok: true, auth };
}

/**
 * Host-gate: hosts and admins pass; pure customers (or visitors) get 403
 * (401 when unauthenticated). Used by host-only listing endpoints.
 */
export async function requireHost(): Promise<
  { ok: true; auth: AuthContext } | { ok: false; response: Response }
> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (!result.auth.isHost) {
    return {
      ok: false,
      response: jsonError(
        403,
        "Host access required. Complete the Become a Host onboarding first."
      ),
    };
  }
  return result;
}

/** Admin-gate for the /api/admin/* surface. */
export async function requireAdmin(): Promise<
  { ok: true; auth: AuthContext } | { ok: false; response: Response }
> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (!result.auth.isAdmin) {
    return {
      ok: false,
      response: jsonError(403, "Admin access required for this action."),
    };
  }
  return result;
}
