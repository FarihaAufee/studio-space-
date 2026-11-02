import { MongoClient, type Db } from "mongodb";

/**
 * Server-only MongoDB connection used by Better Auth.
 *
 * The Atlas URI and database name are read from environment variables so no
 * credentials are ever bundled into client-side code.
 */

const uri = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB_NAME ?? "studio_space";

if (!uri) {
  throw new Error(
    "Missing MONGODB_URL environment variable. " +
      "Set it to the MongoDB Atlas connection string in .env.local (see .env.example)."
  );
}

// Cache the client on `globalThis` so hot reloads in development reuse the
// same connection instead of opening a new pool on every module evaluation.
const globalForMongo = globalThis as unknown as {
  __studioSpaceMongoClient?: MongoClient;
};

export const mongoClient: MongoClient =
  globalForMongo.__studioSpaceMongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production" && !globalForMongo.__studioSpaceMongoClient) {
  globalForMongo.__studioSpaceMongoClient = mongoClient;
}

export const mongoDb: Db = mongoClient.db(dbName);
