import { MongoClient, type Db } from "mongodb";

/**
 * Server-only MongoDB connection shared by the whole app:
 *
 *  - Better Auth (src/lib/auth.ts) hands `mongoClient` + `mongoDb` to the
 *    Better Auth MongoDB adapter when the auth module is evaluated.
 *  - Application data access (src/lib/db.ts) resolves the live Db through
 *    `getMongoDb()` at call time.
 *
 * Lifecycle rules (validated against the mongodb 7.8 driver source):
 *
 * 1. Exactly ONE MongoClient per process. Dev hot reload reuses it through
 *    the `globalThis` cache, so a re-evaluated module never opens a second
 *    connection pool and never captures a stale client.
 * 2. The connect promise is cached the same way: concurrent callers join the
 *    in-flight promise, an already-connected client resolves immediately
 *    (the driver no-ops `connect()` while the topology is up), and a FAILED
 *    promise is cleared so the next call makes a fresh attempt instead of
 *    awaiting a rejected promise forever.
 * 3. Recovery after a failed connect is safe ON THE SAME CLIENT OBJECT:
 *    `MongoClient.connect()` rebuilds the internal topology from scratch
 *    (`_connect()` constructs a new `Topology`), so every long-lived handle
 *    — the exported `mongoDb` held by Better Auth's adapter, collection
 *    handles, cursors — stays valid because all operations route through
 *    the client's current topology. Never discard/replace the client.
 * 4. Nothing closes the shared client during normal request processing.
 *    (The catalog of the bug this fixed: with no explicit `connect()`, the
 *    driver's first lazy "autoConnect" failure marks the topology CLOSED and
 *    `autoConnect` never retries unless the topology is undefined, so every
 *    later operation threw `MongoTopologyClosedError` permanently.)
 */

const uri = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB_NAME ?? "studio_space";

if (!uri) {
  throw new Error(
    "Missing MONGODB_URL environment variable. " +
      "Set it to the MongoDB Atlas connection string in .env.local (see .env.example)."
  );
}

// Cache the client AND the connect promise on `globalThis` so hot reloads in
// development reuse the same connection instead of opening a new pool (or a
// new bootstrap promise) on every module evaluation.
const globalForMongo = globalThis as unknown as {
  __studioSpaceMongoClient?: MongoClient;
  __studioSpaceMongoPromise?: Promise<MongoClient>;
};

export const mongoClient: MongoClient =
  globalForMongo.__studioSpaceMongoClient ?? new MongoClient(uri);

globalForMongo.__studioSpaceMongoClient = mongoClient;

/**
 * Database handle argument captured once by Better Auth's MongoDB adapter.
 * Valid for the whole process lifetime: it routes every operation through
 * the client's current topology, including after a reconnect in `connect()`.
 */
export const mongoDb: Db = mongoClient.db(dbName);

export function connectMongo(): Promise<MongoClient> {
  const cached = globalForMongo.__studioSpaceMongoPromise;
  if (cached) return cached;

  const promise = mongoClient.connect().then(
    () => mongoClient,
    (error) => {
      // Clear only the failed promise; a later caller reconnects the SAME
      // client (the driver rebuilds its closed topology), so neither the
      // exported handle above nor Better Auth's captured references rot.
      if (globalForMongo.__studioSpaceMongoPromise === promise) {
        globalForMongo.__studioSpaceMongoPromise = undefined;
      }
      throw error;
    }
  );
  globalForMongo.__studioSpaceMongoPromise = promise;
  return promise;
}

/**
 * Db handle for request-time data access. Always awaits the shared connect
 * (cached), so a cold start or a transient Atlas outage fails in ONE request
 * with the real network error and the next request reconnects normally.
 */
export async function getMongoDb(): Promise<Db> {
  const client = await connectMongo();
  return client.db(dbName);
}

// Warm the connection as soon as the module is evaluated (server boot in
// Next.js) so the first request is not the one paying for it. A boot-time
// failure must not become an unhandled rejection — recovery is driven by
// whichever request first hits `connectMongo()`/`getMongoDb()`.
void connectMongo().catch(() => {
  /* intentional: surfaced later through the first real database call */
});

