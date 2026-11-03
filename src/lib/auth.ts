
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient, mongoDb } from "@/lib/mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
      /**
       * Role field for the StudioSpace multi-role system — "customer" (the
       * default), "host", or "admin".
       *
       * Security: `input: false` blocks clients from setting the value
       * through any Better Auth endpoint. New sign-ups receive the
       * "customer" default; "host" is granted exclusively by the server
       * after successful Become a Host validation (POST /api/hosts/apply)
       * via a direct, session-verified database update; "admin" is only
       * ever assigned manually or through the ADMIN_EMAILS env list
       * (src/lib/admin.ts). A missing role on legacy accounts is treated
       * as "customer" by src/lib/api-server.ts.
       */
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  plugins: [nextCookies()],
});
