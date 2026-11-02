import type { ReactNode } from "react";

/**
 * Cache Components migration: every page in the admin area reads the
 * Better Auth session (request data via getServerSession → headers()) and
 * must block on the server. Opting the /admin segment out of prerender
 * validation keeps the existing auth-gate behaviour unchanged — see
 * nextjs.org/docs/app/guides/instant-navigation#opting-out
 */
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
