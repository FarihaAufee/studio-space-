import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Terms & Conditions — StudioSpace",
  description: "The terms that govern the use of StudioSpace.",
};

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms & Conditions"
      description="The complete terms for creators and hosts will be published at launch, alongside booking and cancellation policies."
    />
  );
}
