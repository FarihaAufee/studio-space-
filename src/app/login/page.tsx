import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — StudioSpace",
  description: "Sign in to StudioSpace to manage your bookings and studio listings.",
};

export default function LoginPage() {
  return (
    <div className="container-page flex flex-col py-16 md:py-24">
      <AuthForm mode="login" />
    </div>
  );
}
