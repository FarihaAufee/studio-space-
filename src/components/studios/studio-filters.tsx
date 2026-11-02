"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/categories";

const inputClasses =
  "h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const selectClasses =
  "h-11 w-full appearance-none rounded-2xl border border-input bg-card px-4 pr-9 text-sm text-foreground outline-none transition-colors focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [color-scheme:light] [&>option]:bg-white [&>option]:text-[#252A24] [&>option:checked]:bg-[#E9E5DB] [&>option:checked]:text-[#252A24]";

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
];

const FILTER_KEYS = ["search", "category", "location", "minPrice", "maxPrice", "sort"];

/**
 * Studio gallery filter bar. Editing the fields pushes new query params
 * (the page itself filters server-side via the backend's query params), so
 * results are shareable links and the browser back button behaves.
 */
export function StudioFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (location.trim()) params.set("location", location.trim());
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/studios${params.size ? `?${params.toString()}` : ""}`);
  };

  const hasActiveFilters = FILTER_KEYS.some((key) =>
    key === "sort"
      ? searchParams.get("sort") === "price-asc" ||
        searchParams.get("sort") === "price-desc"
      : searchParams.get(key) !== null
  );

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    router.push("/studios");
  };

  return (
    <form
      onSubmit={applyFilters}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-[0_2px_24px_rgba(37,42,36,0.05)] md:p-6"
      aria-label="Filter studios"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-heading text-lg tracking-tight">
          <SlidersHorizontal className="size-4.5 text-primary" aria-hidden="true" />
          Refine your search
        </p>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground"
          >
            <X className="size-3.5" /> Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Free-text search — hits the backend's `search` filter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-search" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Search
          </label>
          <input
            id="filter-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Studio name, category, host…"
            className={inputClasses}
          />
        </div>

        {/* Category select values are slugs; the page maps them to titles. */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-category" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Category
          </label>
          <select
            id="filter-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={selectClasses}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-location" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Location
          </label>
          <input
            id="filter-location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City or area"
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-min-price" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Min price (৳)
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-max-price" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Max price (৳)
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Any"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-sort" className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Sort by
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={selectClasses}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Apply filters
        </Button>
      </div>
    </form>
  );
}

/** Suspense-friendly skeleton used while the filter bar hydrates. */
export function StudioFiltersSkeleton() {
  return (
    <div className="h-[19rem] animate-pulse rounded-3xl border border-border bg-card/60 md:h-[13.5rem]" />
  );
}
