import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "About Us — StudioSpace",
  description: "The story behind StudioSpace and the creators we build for.",
};

export default function AboutPage() {
  return (
    <ComingSoon
      title="We believe every creator deserves a beautiful space to work"
      description="Our full story — the team, the mission and what drives StudioSpace — will be published with the site launch."
    />
  );
}
