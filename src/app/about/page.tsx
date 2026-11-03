
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  Film,
  Mic2,
  Music2,
  Palette,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — StudioSpace",
  description:
    "Discover StudioSpace, a creative studio marketplace built to connect creators with inspiring spaces.",
};

const categories = [
  {
    number: "01",
    title: "Photography",
    description: "Spaces made for capturing extraordinary moments.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
    icon: Camera,
  },
  {
    number: "02",
    title: "Film & Video",
    description: "Creative environments for visual storytelling.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85",
    icon: Film,
  },
  {
    number: "03",
    title: "Podcast Rooms",
    description: "Dedicated spaces for conversations and ideas.",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=85",
    icon: Mic2,
  },
  {
    number: "04",
    title: "Music Suites",
    description: "Inspiring rooms for music and sound creation.",
    image:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85",
    icon: Music2,
  },
  {
    number: "05",
    title: "Art Workshops",
    description: "Room to experiment, express and create.",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85",
    icon: Palette,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#1d241e] text-[#eeeadd]">
      {/* Hero */}
      <section className="mx-auto max-w-[1600px] px-6 pb-20 pt-20 sm:px-10 lg:px-16 lg:pb-28 lg:pt-28">
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[#a5b39a]">
              <span className="h-px w-9 bg-[#a5b39a]" />
              The story of StudioSpace
            </p>

            <h1 className="max-w-4xl font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-8xl">
              A space for
              <br />
              every <span className="text-[#a5b39a] italic">creative</span>
              <br />
              vision.
            </h1>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-md text-base leading-8 text-[#a9afa5] sm:text-lg">
                We believe the right environment can change everything.
                StudioSpace brings creative people and inspiring spaces
                together.
              </p>

              <Link
                href="/studios"
                className="inline-flex w-fit shrink-0 items-center gap-3 border-b border-[#a5b39a] pb-2 text-sm text-[#e9eadf] transition hover:text-[#a5b39a]"
              >
                Discover studios
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[5/4] overflow-hidden rounded-sm">
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=90"
                alt="A thoughtfully designed creative workspace"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-4 bg-[#a5b39a] px-5 py-4 text-[#1d241e] sm:-left-7 sm:px-7">
              <Sparkles size={21} strokeWidth={1.5} />
              <p className="mt-2 font-serif text-xl italic">
                Create with intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="border-y border-white/10 bg-[#232b24] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#a5b39a]">
              01 / Who we are
            </p>
          </div>

          <div>
            <h2 className="max-w-4xl font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
              More than a place to work. A place where ideas take shape.
            </h2>
            <p className="mt-8 max-w-3xl text-base leading-8 text-[#a9afa5]">
              StudioSpace is a marketplace designed to make discovering and
              booking creative studios easier. From photography and filmmaking
              to music, podcasts and art, we bring different creative
              environments into one place.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#a9afa5]">
              We also give studio owners a platform to showcase their spaces
              and connect with people looking for the right environment for
              their next project.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-[#a5b39a]">
              02 / Our philosophy
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl">
              Creativity needs <span className="italic text-[#a5b39a]">room.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#a9afa5]">
            Our purpose is simple: make creative spaces easier to discover,
            access and share.
          </p>
        </div>

        <div className="grid gap-px bg-white/10 md:grid-cols-2">
          <div className="bg-[#1d241e] p-8 sm:p-12">
            <span className="font-serif text-5xl text-[#a5b39a]">01</span>
            <h3 className="mt-8 font-serif text-3xl">Our Mission</h3>
            <p className="mt-5 max-w-md leading-8 text-[#a9afa5]">
              To connect creators with spaces that support their imagination,
              their work and their creative journey.
            </p>
          </div>

          <div className="bg-[#1d241e] p-8 sm:p-12">
            <span className="font-serif text-5xl text-[#a5b39a]">02</span>
            <h3 className="mt-8 font-serif text-3xl">Our Vision</h3>
            <p className="mt-5 max-w-md leading-8 text-[#a9afa5]">
              To build a connected creative community where discovering a
              great workspace is the beginning of something meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#232b24] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.3em] text-[#a5b39a]">
                03 / Explore possibilities
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl">
                Spaces for every story.
              </h2>
            </div>
            <Link
              href="/studios"
              className="inline-flex items-center gap-2 text-sm text-[#a5b39a] transition hover:text-white"
            >
              Explore all studios <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  href="/studios"
                  key={category.number}
                  className="group relative overflow-hidden border border-white/10 bg-[#1d241e]"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs tracking-widest text-[#a5b39a]">
                        {category.number}
                      </span>
                      <Icon size={20} className="text-[#a5b39a]" strokeWidth={1.4} />
                    </div>

                    <h3 className="mt-5 font-serif text-2xl">
                      {category.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#a9afa5]">
                      {category.description}
                    </p>

                    <div className="mt-6 flex justify-end text-[#a5b39a] transition group-hover:translate-x-1">
                      <ArrowUpRight size={19} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 text-center sm:px-10 lg:px-16 lg:py-36">
        <p className="mb-7 text-xs uppercase tracking-[0.3em] text-[#a5b39a]">
          04 / Your next chapter
        </p>

        <h2 className="mx-auto max-w-4xl font-serif text-4xl leading-tight sm:text-5xl lg:text-7xl">
          Find your space.
          <br />
          <span className="italic text-[#a5b39a]">
            Create your vision.
          </span>
        </h2>

        <p className="mx-auto mt-7 max-w-lg leading-8 text-[#a9afa5]">
          Your next creative project deserves the right setting. Find a space
          that brings your ideas to life.
        </p>

        <Link
          href="/studios"
          className="mt-10 inline-flex items-center gap-3 border border-[#a5b39a]/60 px-8 py-4 text-sm transition hover:bg-[#a5b39a] hover:text-[#1d241e]"
        >
          Explore StudioSpace
          <ArrowDownRight size={18} />
        </Link>
      </section>
    </main>
  );
}
