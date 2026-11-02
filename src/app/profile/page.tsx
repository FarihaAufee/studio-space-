import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Profile — StudioSpace",
  description:
    "Manage your StudioSpace profile information, photo, security settings and quick links.",
};

/**
 * My Profile — a protected route rendered only for signed-in users. The
 * Better Auth server session gates access; the interactive view keeps itself
 * fresh with the reactive Better Auth client session.
 */
export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return <ProfileView />;
}
