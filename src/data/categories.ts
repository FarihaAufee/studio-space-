export interface Category {
  slug: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

/**
 * Homepage category cards. Slugs match the studio gallery URL convention:
 * /studios?category=<slug>
 */
export const CATEGORIES: Category[] = [
  {
    slug: "photo-studios",
    title: "Photo Studios",
    description: "Perfect spaces for capturing stunning visuals.",
    image: "/images/photo-studio.jpg",
    alt: "Bright daylight photo studio with a cyc wall and industrial windows",
  },
  {
    slug: "film-stages",
    title: "Film Stages",
    description: "Professional spaces for film and video production.",
    image: "/images/film-studio.jpg",
    alt: "Large film stage with a grid of overhead lighting rigs",
  },
  {
    slug: "podcast-rooms",
    title: "Podcast Rooms",
    description: "Sound-treated rooms for conversations and recordings.",
    image: "/images/podcast-studio.jpg",
    alt: "Sound-treated podcast room with microphones, headphones and an audio mixer",
  },
  {
    slug: "music-suites",
    title: "Music Suites",
    description: "Creative environments for music production.",
    image: "/images/music-studio.jpg",
    alt: "Recording studio control room with a large mixing console",
  },
  {
    slug: "art-workshops",
    title: "Art Workshops",
    description: "Inspiring spaces for artists and makers.",
    image: "/images/art-studio.jpg",
    alt: "Sunlit art studio with easels, paintings and a working artist",
  },
];
