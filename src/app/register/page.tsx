import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Register — StudioSpace",
  description: "Create a StudioSpace account to book studios or list your own.",
};

// Cache Components migration: this route reads `searchParams` (the ?next=
// return target, request data) and must block on the server — see
// nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

/** Same as the login page — only same-origin absolute paths are accepted. */
function safeNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="container-page flex flex-col py-16 md:py-24">
      {/* With a return target, sign-up goes straight back to the gated page;
          without one the existing flow (login → Become a Host) is kept. */}
      <AuthForm
        mode="register"
        redirectTarget={next ?? "/login?next=/become-a-host"}
        showReturnNotice={Boolean(next)}
      />
    </div>
  );
}
