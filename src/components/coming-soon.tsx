import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description: string;
}

/**
 * Shared placeholder used by pages whose full experience arrives with the
 * backend (studio listings, about, legal). Keeps routes honest without a 404.
 */
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center md:py-32">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-primary">
        <Compass className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="mt-8 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/" />}>Back to Home</Button>
        <Button variant="outline" render={<Link href="/register" />}>
          Become a Host
        </Button>
      </div>
    </section>
  );
}
