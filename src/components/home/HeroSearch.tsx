"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = [
  { label: "Photo Studios", value: "photo-studios" },
  { label: "Film Stages", value: "film-stages" },
  { label: "Podcast Rooms", value: "podcast-rooms" },
  { label: "Music Suites", value: "music-suites" },
  { label: "Art Workshops", value: "art-workshops" },
];

/**
 * Hero search bar. No search backend exists yet, so submitting navigates
 * to the studios gallery (with the chosen filters in the query string)
 * instead of inventing results.
 */
export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (category) params.set("category", category);
    const query = params.toString();
    router.push(query ? `/studios?${query}` : "/studios");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search studio spaces"
      className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-border bg-card p-2 shadow-[0_12px_48px_rgba(37,42,36,0.08)] transition-shadow duration-300 focus-within:border-ring/40"
    >
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <div className="grid gap-1 md:grid-cols-2 md:divide-x md:divide-border/70">
          {/* Location */}
          <div className="flex h-12 items-center gap-3 rounded-full px-4 md:rounded-none">
            <MapPin
              className="size-4.5 shrink-0 text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <label htmlFor="hero-location" className="sr-only">
              Location
            </label>
            <input
              id="hero-location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or location"
              className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Category */}
          <div className="relative flex h-12 items-center gap-3 px-4 md:pl-5">
            <Camera
              className="size-4.5 shrink-0 text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <label htmlFor="hero-category" className="sr-only">
              Studio category
            </label>
            <select
              id="hero-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-full w-full appearance-none rounded-full bg-transparent pr-5 text-sm text-foreground outline-none md:rounded-none focus-visible:ring-3 focus-visible:ring-ring/50 [color-scheme:light] [&>option]:bg-white [&>option]:text-[#252A24] [&>option:hover]:bg-[#E9E5DB] [&>option:hover]:text-[#252A24] [&>option:checked]:bg-[#E9E5DB] [&>option:checked]:text-[#252A24]"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Search */}
        <Button type="submit" size="lg" className="w-full md:w-auto">
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
      </div>
    </form>
  );
}
