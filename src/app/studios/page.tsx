import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SearchX } from "lucide-react";
import { listStudios } from "@/lib/db";
import type { Studio } from "@/app/studios/studios";
import { CATEGORIES } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { StudioGrid } from "@/components/studios/studio-card";
import { StudioFilters, StudioFiltersSkeleton } from "@/components/studios/studio-filters";

// Cache Components migration: this route renders live studio data from the
// API per request, so it must block on the server — see
// nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Explore Studios — StudioSpace",
  description:
    "Search and filter photography, film, podcast, music and art studios available to book on StudioSpace.",
};

interface StudiosQuery {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

/** Maps a category slug ("photo-studios") to the stored title ("Photo Studios"). */
function resolveCategoryTitle(category?: string): string | undefined {
  if (!category) return undefined;
  return CATEGORIES.find((item) => item.slug === category)?.title ?? category;
}

function sortStudios(studios: Studio[], sort: string): Studio[] {
  // The backend returns newest-first; only price sorting needs work here.
  if (sort === "price-asc") {
    return [...studios].sort((a, b) => a.hourlyRate - b.hourlyRate);
  }
  if (sort === "price-desc") {
    return [...studios].sort((a, b) => b.hourlyRate - a.hourlyRate);
  }
  return studios;
}

async function FilteredStudios({ query }: { query: StudiosQuery }) {
  // Category values may arrive as slugs from homepage/filters links; the
  // db layer normalizes them to the stored title.
  const categoryTitle = resolveCategoryTitle(query.category);

  const toNumberOrNull = (value?: string) => {
    if (!value || !value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  let studios: Studio[];
  try {
    // Render at request time: live studio data must not be captured into the
    // prerendered shell (see nextjs.org/docs/messages/blocking-prerender-
    // current-time). connection() also keeps any other request-time values
    // in this route from being evaluated while prerendering.
    await connection();
    // Server components read the database directly (same data the public
    // GET /api/studios route serves) — no self-HTTP fetch is needed.
    studios = await listStudios({
      search: query.search ?? null,
      category: categoryTitle ?? null,
      location: query.location ?? null,
      minPrice: toNumberOrNull(query.minPrice),
      maxPrice: toNumberOrNull(query.maxPrice),
    });
  } catch (error) {
    console.error(error);
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-2xl tracking-tight">
          Studios are unavailable right now
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          We could not reach the studio catalog. Please try again in a moment.
        </p>
        <Button variant="outline" render={<Link href="/studios" />}>
          Retry
        </Button>
      </div>
    );
  }

  const sorted = sortStudios(studios, query.sort ?? "newest");

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">No studios matched</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Try a different category, widen the price range, or clear the filters
          to see every studio.
        </p>
        <Button variant="outline" render={<Link href="/studios" />}>
          Clear all filters
        </Button>
      </div>
    );
  }

  return <StudioGrid studios={sorted} />;
}

export default async function StudiosPage({
  searchParams,
}: {
  searchParams: Promise<StudiosQuery>;
}) {
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        {/* Page header */}
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Studio gallery
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            Explore Studios
          </h1>
          <p className="mt-3 text-muted-foreground">
            Discover the perfect creative space for your next project — from
            daylight photo studios to treated podcast rooms.
          </p>
        </header>

        {/* Filter bar. Suspense required: it reads the URL search params. */}
        <div className="mt-8">
          <Suspense fallback={<StudioFiltersSkeleton />}>
            <StudioFilters />
          </Suspense>
        </div>

        <section className="mt-8" aria-label="Studio results">
          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-80 animate-pulse rounded-3xl bg-muted/70"
                  />
                ))}
              </div>
            }
          >
            <FilteredStudios query={query} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
