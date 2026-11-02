import { CATEGORIES } from "@/data/categories";
import { CategoryCard } from "@/components/home/CategoryCard";

/**
 * Editorial 3 + 2 grid: on desktop the first row holds three cards
 * (2 of 6 columns each) and the second row holds two balanced cards
 * (3 of 6 columns each). Tablet collapses to 2 columns, mobile to 1.
 */
const CARD_GRID_CLASSES = [
  "sm:col-span-3 lg:col-span-2",
  "sm:col-span-3 lg:col-span-2",
  "sm:col-span-3 lg:col-span-2",
  "sm:col-span-3 lg:col-start-1 lg:col-span-3",
  "sm:col-span-3 sm:col-start-2 lg:col-start-4 lg:col-span-3",
];

export function Categories() {
  return (
    <section id="categories" className="container-page py-16 md:py-24">
      {/* Section header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
          Explore by category
          <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
        </p>
        <h2 className="mt-5 font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          Find a Space for Every Creative Vision
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          From professional photography studios to inspiring art workshops,
          discover the perfect environment for your next project.
        </p>
      </div>

      {/* Cards */}
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-6 sm:gap-6 md:mt-12">
        {CATEGORIES.map((category, index) => (
          <CategoryCard
            key={category.slug}
            category={category}
            className={CARD_GRID_CLASSES[index]}
          />
        ))}
      </div>
    </section>
  );
}
