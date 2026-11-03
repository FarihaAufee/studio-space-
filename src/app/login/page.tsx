import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — StudioSpace",
  description: "Sign in to StudioSpace to manage your bookings and studio listings.",
};

// Cache Components migration: this route reads `searchParams` (the ?next=
// return target, request data) and must block on the server — see
// nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

/**
 * Only same-origin absolute paths are accepted as return targets — this
 * defeats open-redirects (`//evil.com`, absolute URLs, etc.).
 */
function safeNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="container-page flex flex-col py-16 md:py-24">
      <AuthForm mode="login" redirectTarget={next} showReturnNotice />
    </div>
  );
}
