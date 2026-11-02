import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Register — StudioSpace",
  description: "Create a StudioSpace account to book studios or list your own.",
};

export default function RegisterPage() {
  return (
    <div className="container-page flex flex-col py-16 md:py-24">
      <AuthForm mode="register" />
    </div>
  );
}
