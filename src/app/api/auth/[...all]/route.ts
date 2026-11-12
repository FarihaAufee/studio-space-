import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
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
    return handler(request);
  };
}

export const GET = withMongo(authHandlers.GET);
export const POST = withMongo(authHandlers.POST);
