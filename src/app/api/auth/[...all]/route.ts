import { toNextJsHandler } from "better-auth/next-js";
import { auth, authDiagnostics } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";

/**
 * Mounts the Better Auth API at /api/auth/*.
 *
 * This exposes every auth endpoint (sign-up, sign-in, sign-out, social
 * callbacks, session) under a single catch-all route.
 */
const authHandlers = toNextJsHandler(auth);

/**
 * Ensure the shared MongoDB connection before Better Auth touches the
 * database. Better Auth's adapter uses the captured mongoClient/mongoDb
 * directly and never goes through connectMongo()/getMongoDb(), so if the
 * boot-time warm-up connect failed (e.g. a network hiccup at server start)
 * the closed topology never recovered and every auth endpoint returned
 * SERVER_ERROR. connectMongo() is cached (free once connected) and
 * reconnects the SAME client after a failure, so all captured handles stay
 * valid — this is the recovery driver the mongo module's design expects.
 */
function withMongo(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    await connectMongo();
    logAuthDiagnosticsOnce();
    return handler(request);
  };
}

export const GET = withMongo(authHandlers.GET);
export const POST = withMongo(authHandlers.POST);

/**
 * One-time-per-process auth configuration diagnostic (no secrets).
 *
 * On the FIRST auth request the server logs:
 *  - the OAuth base URL origin Better Auth builds every `redirect_uri` from,
 *  - which env var won the resolution chain (src/lib/auth.ts),
 *  - whether Google/GitHub credentials are present (boolean, not values),
 *  - the two exact callback URLs that must be registered in the Google Cloud
 *    console and the GitHub OAuth app.
 *
 * On Vercel production it additionally warns loudly when the resolved origin
 * differs from the registered production domain — the configuration state
 * that deterministically produces `redirect_uri_mismatch` on Google sign-in.
 * Everything else (functionality) is untouched: this is observability only.
 */
const globalForAuthLog = globalThis as unknown as {
  __studioSpaceAuthDiagnosticLogged?: boolean;
};

function logAuthDiagnosticsOnce() {
  if (globalForAuthLog.__studioSpaceAuthDiagnosticLogged) return;
  globalForAuthLog.__studioSpaceAuthDiagnosticLogged = true;

  const { baseURL, source, providers, expectedCallbacks } = authDiagnostics;
  console.info(
    `[auth] OAuth base URL: ${baseURL} (source: ${source}). ` +
      `Google credentials: ${providers.google ? "configured" : "MISSING"}. ` +
      `GitHub credentials: ${providers.github ? "configured" : "MISSING"}. ` +
      `Register these redirect URIs in the provider consoles: ` +
      `${expectedCallbacks.google} | ${expectedCallbacks.github}`
  );

  if (authDiagnostics.productionMismatch) {
    console.warn(
      `[auth] PRODUCTION MISMATCH: this Vercel production deployment resolved ` +
        `its OAuth base URL to ${baseURL}, but the registered production domain ` +
        `is https://studio-space-ten.vercel.app. Google/GitHub will reject the ` +
        `callback with redirect_uri_mismatch. Fix BETTER_AUTH_URL in the Vercel ` +
        `dashboard (Project → Settings → Environment Variables) to ` +
        `https://studio-space-ten.vercel.app and redeploy.`
    );
  }
}
