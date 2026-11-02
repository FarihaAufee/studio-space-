import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Privacy Policy — StudioSpace",
  description: "How StudioSpace collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="Our full privacy policy will be published at launch. In short: we only use your data to make StudioSpace work better for you."
    />
  );
}
