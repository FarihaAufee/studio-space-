import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Server-side session access for App Router components, layouts, and route
 * handlers. Returns `null` when the visitor has no valid session.
 */
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
