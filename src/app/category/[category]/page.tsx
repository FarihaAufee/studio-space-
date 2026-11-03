import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listStudiosByCategory } from "@/lib/db";
import type { Studio } from "@/app/studios/studios";
import { CATEGORIES } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { StudioGrid } from "@/components/studios/studio-card";

// Cache Components migration: this route resolves runtime params and live
// studio data from the API, so it must block on the server — see
// nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

/**
 * Resolves a category identifier to the canonical `{ slug, title }` pair.
 * Accepts slugs ("photo-studios", used by homepage links), titles, or any
 * stored category value; unknown identifiers still work by passing the raw
 * value straight to the backend, which matches case-insensitively.
 */
function resolveCategory(identifier: string) {
  const value = decodeURIComponent(identifier).trim();
  const known = CATEGORIES.find(
    (item) =>
      item.slug === value.toLowerCase() ||
      item.title.toLowerCase() === value.toLowerCase()
  );
  return known ?? { slug: value, title: value };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const { title } = resolveCategory(category);
  return {
    title: `${title} Studios — StudioSpace`,
    description: `Browse ${title.toLowerCase()} available to book on StudioSpace.`,
  };
}

async function CategoryStudios({ category }: { category: string }) {
  let studios: Studio[];
  try {
    // Server components read the database directly (same data the public
    // GET /api/categories/:category/studios route serves).
    studios = await listStudiosByCategory(category);
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
          Back to all studios
        </Button>
      </div>
    );
  }

  if (studios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-2xl tracking-tight">
          No studios in this category yet
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Hosts list new spaces regularly — check back soon or explore the
          full gallery.
        </p>
        <Button variant="outline" render={<Link href="/studios" />}>
          Explore all studios
        </Button>
      </div>
    );
  }

  return <StudioGrid studios={studios} />;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const { title } = resolveCategory(category);

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <Link
          href="/studios"
          className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to studios
        </Link>

        <header className="mt-6 max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Category
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Creative spaces in the {title} category, ready to book by the hour.
          </p>
        </header>

        <section className="mt-8" aria-label={`${title} studios`}>
          <CategoryStudios category={title} />
        </section>
      </div>
    </main>
  );
}
