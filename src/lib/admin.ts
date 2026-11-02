/**
 * Server-side admin authorization for Next.js pages (/admin/*).
 *
 * Reads the ADMIN_EMAILS environment variable (comma-separated Better Auth
 * account emails). This module must only be imported from server components
 * / route handlers — it is never safe to import in client components, so the
 * admin list is never shipped to the browser.
 *
 * The protected API routes enforce the same check server-side
 * (studio-space-server → middleware/adminMiddleware.js with its own
 * ADMIN_EMAILS); this guard is the first, page-level layer that keeps
 * non-admins out of /admin screens entirely.
 *
 * There is no client-side or request-body path to admin status: only the
 * verified Better Auth session email matched against this env list matters.
 */
export function getAdminEmails(source = process.env.ADMIN_EMAILS) {
  return new Set(
    (source || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string" || !email.trim()) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
