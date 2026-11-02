
import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  Film,
  Mic,
  Music,
  Palette,
  Target,
  Eye,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — StudioSpace",
  description:
    "Discover StudioSpace, a marketplace connecting creators with inspiring spaces for photography, film, music, podcasts and art.",
};

const categories = [
  { icon: Camera, title: "Photography Studios", description: "Find beautiful spaces for photoshoots and creative projects." },
  { icon: Film, title: "Film Stages", description: "Discover production-ready spaces for filming and video creation." },
  { icon: Mic, title: "Podcast Rooms", description: "Create clear, professional audio content in dedicated spaces." },
  { icon: Music, title: "Music Suites", description: "Find inspiring environments for music production and recording." },
  { icon: Palette, title: "Art Workshops", description: "Explore creative spaces designed for artists and makers." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            About StudioSpace
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Every great creation deserves
            <span className="text-emerald-400"> the right space.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            StudioSpace connects creators with inspiring spaces where ideas
            become reality. Discover, book, and create in a space that fits
            your vision.
          </p>
          <Link
            href="/studios"
            className="mt-9 inline-flex rounded-full bg-emerald-500 px-7 py-3 font-semibold text-white transition hover:bg-emerald-600"
          >
            Explore Studios
          </Link>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-8">
          <Target className="mb-5 h-9 w-9 text-emerald-600" />
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="mt-4 leading-7 text-slate-600">
            Our mission is to make creative spaces accessible to everyone by
            connecting talented creators with the right studios, equipment,
            and environments.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-8">
          <Eye className="mb-5 h-9 w-9 text-emerald-600" />
          <h2 className="text-2xl font-bold">Our Vision</h2>
          <p className="mt-4 leading-7 text-slate-600">
            We envision a creative community where anyone can find a space to
            express ideas, collaborate, experiment, and bring their projects
            to life.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="font-semibold uppercase tracking-widest text-emerald-600">
              What We Do
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              One platform, endless creative possibilities
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              From photography to music production, discover spaces for every
              kind of creative journey.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Icon className="h-8 w-8 text-emerald-600" />
                  <h3 className="mt-5 text-lg font-bold">{category.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why StudioSpace */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <Heart className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-5 text-3xl font-bold">
          Built for creators, powered by creativity
        </h2>
        <p className="mx-auto mt-5 max-w-3xl leading-8 text-slate-600">
          Whether you are a photographer, filmmaker, musician, podcaster, or
          artist, StudioSpace helps you discover spaces that match your needs.
          Studio owners can showcase their spaces and connect with creators
          looking for the perfect place to work.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">
          Ready to find your creative space?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-emerald-50">
          Explore inspiring studios and take your next creative project further.
        </p>
        <Link
          href="/studios"
          className="mt-8 inline-flex rounded-full bg-white px-8 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Discover Studios
        </Link>
      </section>
    </main>
  );
}
