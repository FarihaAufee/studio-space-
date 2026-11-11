import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    /**
     * External hosts studio images are hot-linked from. Every <Image> in the
     * app currently passes `unoptimized`, so these URLs bypass the image
     * optimizer entirely — this list is the safety net for any future
     * component that renders optimized images instead: without it, the
     * optimizer rejects unknown external hosts with `400 Bad Request`.
     *
     *  - images.unsplash.com + www.altitude-photo.com: seeded direct-URL
     *    studios (source: "url")
     *  - **.cloudinary.com: Cloudinary uploads (each account gets its own
     *    res.cloudinary.com subdomain)
     */
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.altitude-photo.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default nextConfig;
