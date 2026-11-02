import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient, mongoDb } from "@/lib/mongodb";

/**
 * Better Auth server configuration.
 *
 * - Stores users, sessions, and accounts in the `studio_space` MongoDB Atlas
 *   database through the official Better Auth MongoDB adapter.
 * - Enables email/password sign-up and sign-in.
 * - Enables Google and GitHub social login whenever their credentials are
 *   present in the environment; a provider without credentials is skipped so
 *   the app keeps working while only some providers are configured.
 */

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    // Passing the client enables database transactions (Atlas is a replica set).
    client: mongoClient,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    // Optional profile fields persisted on the user document in MongoDB via
    // `authClient.updateUser()` alongside the default name/image fields.
    additionalFields: {
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
    },
  },
  socialProviders,
  session: {
    // 30-day sessions, refreshed once per day.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  plugins: [nextCookies()],
});
