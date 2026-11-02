import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/HeroSearch";

/**
 * Homepage hero: split editorial layout with the brand palette,
 * a dominant priority-loaded studio image, and the studio search bar.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft beige glow behind the imagery */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-12rem] size-[34rem] rounded-full bg-beige/70 blur-3xl"
      />

      <div className="container-page relative">
        <div className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
          {/* Copy */}
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
              Your space. Your creative vision.
            </p>

            <h1 className="mt-5 font-heading text-[2.75rem] leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Find the{" "}
              <span className="text-primary italic">Perfect Space</span> to
              Bring Your Ideas to Life.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover inspiring studios and creative spaces designed for your
              next photoshoot, film production, podcast, or artistic project.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" render={<Link href="/studios" />}>
                Explore Studios
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/add-studio" />}>
                Become a Host
              </Button>
            </div>

            <p className="mt-8 flex items-center gap-2.5 text-sm text-muted-foreground">
              <Sparkles
                className="size-4 shrink-0 text-primary"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Creative spaces. Endless possibilities.
            </p>
          </div>

          {/* Imagery */}
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-[0_24px_70px_rgba(37,42,36,0.14)] sm:aspect-[5/4] lg:aspect-[5/6]">
              <Image
                src="/images/hero-studio.jpg"
                alt="Warm creative studio with arched doorway, hanging wicker pendants and sage-toned walls"
                fill
                priority
                sizes="(min-width: 1024px) 40rem, (min-width: 640px) 60vw, 100vw"
                className="object-cover"
              />

              {/* Floating info card */}
              <div className="absolute bottom-5 left-5 flex max-w-[85%] items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 pr-6 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-heading text-lg leading-tight text-foreground">
                    Spaces That Inspire
                  </span>
                  <span className="block text-xs text-muted-foreground sm:text-sm">
                    Find your next creative destination.
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="pb-14 md:pb-20">
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}
