
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient, mongoDb } from "@/lib/mongodb";



/** URL string → origin ("https://x.com/app" → "https://x.com"); null if invalid. */
const toOrigin = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};


/** This project's stable production deployment (matches the Google redirect registration). */
const VERCEL_PRODUCTION_URL = "https://studio-space-ten.vercel.app";

const isVercelProduction = process.env.VERCEL_ENV === "production";

/** True for loopback / private-network hosts that must never become the production OAuth callback origin. */
const isPrivateOrLocalHost = (host: string): boolean => {
  const hostname = host.toLowerCase().replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return true;
  if (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd")) return true;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 127 || // loopback
    a === 10 || // RFC1918 10.0.0.0/8 (e.g. the 10.27.250.186 LAN IP)
    (a === 172 && b >= 16 && b <= 31) || // RFC1918 172.16.0.0/12
    (a === 192 && b === 168) || // RFC1918 192.168.0.0/16
    (a === 169 && b === 254) // link-local
  );
};


interface AuthBaseURLCandidate {
  /** Human-readable source name, surfaced through `authDiagnostics`. */
  source: string;
  value: string | undefined;
}

const authBaseURLCandidates: AuthBaseURLCandidate[] = [
  { source: "BETTER_AUTH_URL", value: process.env.BETTER_AUTH_URL },
  {
    source: "VERCEL_PROJECT_PRODUCTION_URL",
    value: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  },
  {
    source: "VERCEL_PRODUCTION_URL (hardcoded safety net)",
    value: isVercelProduction ? VERCEL_PRODUCTION_URL : undefined,
  },
  {
    source: "VERCEL_URL",
    value: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  },
];

const resolvedAuthBaseURL = authBaseURLCandidates
  .map((candidate) => {
    if (!candidate.value) return undefined;
    try {
      return { source: candidate.source, origin: new URL(candidate.value).origin };
    } catch {
      return undefined;
    }
  })
  .find(
    (candidate) =>
      candidate !== undefined &&
      !(isVercelProduction && isPrivateOrLocalHost(new URL(candidate.origin).host)),
  );

const authBaseURL = resolvedAuthBaseURL?.origin ?? "http://localhost:3000";

const trustedOrigins = [
  // Explicitly configured auth URL (e.g. the production domain on Vercel).
  toOrigin(process.env.BETTER_AUTH_URL),

  // The resolved OAuth base URL (covers the fallback chain above).
  authBaseURL,

  // Vercel: the exact domain of the current deployment (covers every preview
  // deployment) and the project's stable production domain.
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,

  // Local development on any port (Next.js shifts to 3001 when 3000 is busy).
  "http://localhost:*",
  "http://127.0.0.1:*",
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({

  baseURL: authBaseURL,

  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

 
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: [],

      allowDifferentEmails: false,
    },
  },

 
  onAPIError: {
    errorURL: "/auth-error",
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
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

  trustedOrigins,

  plugins: [nextCookies()],
});


export const authDiagnostics = {
  /** The origin every OAuth redirect_uri is built from. */
  baseURL: authBaseURL,
  /** Which candidate in the resolution order above won (or the fallback). */
  source: resolvedAuthBaseURL?.source ?? "fallback (http://localhost:3000)",
  isVercelProduction,
  /**
   * True only when a Vercel production deployment resolved to an origin
   * OTHER than the registered production domain — the config mistake that
   * guarantees `redirect_uri_mismatch` in production.
   */
  productionMismatch:
    isVercelProduction && authBaseURL !== VERCEL_PRODUCTION_URL,
  /** Whether each social provider has a full pair of credentials. */
  providers: {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  },
  /** Exact redirect_uri values to register in the provider consoles. */
  expectedCallbacks: {
    google: `${authBaseURL}/api/auth/callback/google`,
    github: `${authBaseURL}/api/auth/callback/github`,
  },
} as const;