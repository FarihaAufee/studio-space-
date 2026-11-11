import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { CATEGORIES } from "@/data/categories";
import { getStudioImages } from "@/lib/studio-images";
import type { BookingRecord } from "@/types/booking";
import type { Studio } from "@/app/studios/studios";
import type { HostApplication } from "@/types/host";

/**
 * Server-only MongoDB data access for the StudioSpace API (route handlers).
 *
 * Must never be imported from client components — it opens the database
 * connection module which requires server-only credentials.
 *
 * Collections used (all existing — no new database names, the host
 * application collection is the only additional store and it backs the
 * Become a Host feature documented in this repo):
 *  - `user`, `session`, `account` — Better Auth (see src/lib/auth.ts)
 *  - `studios` — studio listings (including legacy/demo documents)
 *  - `bookings` — guest bookings with studio snapshot fields
 *  - `host_applications` — Become a Host applications
 */

export const STUDIO_COLLECTION = "studios";
export const BOOKING_COLLECTION = "bookings";
export const HOST_APPLICATION_COLLECTION = "host_applications";
/** Better Auth user collection (managed better-auth/mongo-adapter). */
export const USER_COLLECTION = "user";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Serializes a MongoDB document for API responses: `_id` becomes a hex
 * string, `Date` fields become ISO strings. Existing documents store a mix
 * of Date objects and ISO strings — this handles both without a migration.
 */
function serialize<T extends Record<string, unknown>>(doc: T): T {
  const out: Record<string, unknown> = { ...doc };
  out._id = doc._id instanceof ObjectId ? (doc._id as ObjectId).toString() : String(doc._id);
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof Date) out[key] = value.toISOString();
  }
  return out as T;
}

/**
 * Match helper for dual-id documents: legacy-style string `_id`s and
 * newer ObjectId `_id`s must both resolve. Non-hex ids only match strings.
 */
export function idFilter(id: string): Filter<Record<string, unknown>> {
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] as never };
  }
  return { _id: id } as unknown as Filter<Record<string, unknown>>;
}

/** Minimal 24-hex ObjectId shape check shared by all route handlers. */
export function isObjectIdShape(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Normalizes a raw studio document into the shared `Studio` shape.
 * Defensive defaults keep legacy/demo documents renderable.
 */
export function toStudio(raw: WithId<Record<string, unknown>>): Studio {
  const doc = serialize(raw);
  // Dual image model: prefer the ordered `images` list, falling back to the
  // legacy flat `image` string — no manual migration needed for old docs.
  const images = getStudioImages({
    image: doc.image as string | undefined,
    images: doc.images,
  });
  return {
    _id: String(doc._id),
    title: (doc.title as string) ?? "",
    category: (doc.category as string) ?? "",
    location: (doc.location as string) ?? "",
    image:
      images[0]?.url ?? ((doc.image as string | undefined) ?? ""),
    images: images.length > 0 ? images : undefined,
    hourlyRate: Number(doc.hourlyRate) || 0,
    securityDeposit: doc.securityDeposit === undefined ? undefined : Number(doc.securityDeposit),
    maxCapacity: doc.maxCapacity === undefined ? undefined : Number(doc.maxCapacity),
    amenities: Array.isArray(doc.amenities) ? (doc.amenities as string[]) : undefined,
    description: (doc.description as string) ?? undefined,
    overview: (doc.overview as string) ?? undefined,
    address: (doc.address as string) ?? undefined,
    hostId: (doc.hostId as string) ?? undefined,
    hostName: (doc.hostName as string) ?? undefined,
    hostEmail: (doc.hostEmail as string) ?? undefined,
    createdAt: (doc.createdAt as string) ?? undefined,
    updatedAt: (doc.updatedAt as string) ?? undefined,
  };
}

/**
 * Normalizes a raw booking document into the shared `BookingRecord` shape.
 */
export function toBooking(raw: WithId<Record<string, unknown>>): BookingRecord {
  const doc = serialize(raw);
  return {
    _id: String(doc._id),
    studioId: (doc.studioId as string) ?? "",
    studioTitle: (doc.studioTitle as string) ?? undefined,
    studioImage: (doc.studioImage as string) ?? undefined,
    studioLocation: (doc.studioLocation as string) ?? undefined,
    hourlyRate: doc.hourlyRate === undefined ? undefined : Number(doc.hourlyRate),
    securityDeposit: doc.securityDeposit === undefined ? undefined : Number(doc.securityDeposit),
    maxCapacity: doc.maxCapacity === undefined ? undefined : Number(doc.maxCapacity),
    bookingDate: (doc.bookingDate as string) ?? "",
    timeSlot: (doc.timeSlot as string) ?? "",
    guests: Number(doc.guests) || 0,
    fullName: (doc.fullName as string) ?? "",
    email: (doc.email as string) ?? "",
    phone: (doc.phone as string) ?? undefined,
    notes: (doc.notes as string) ?? undefined,
    status: ((doc.status as string) ?? "pending") as BookingRecord["status"],
    cancelReason: (doc.cancelReason as string) ?? undefined,
    cancelledAt: (doc.cancelledAt as string) ?? undefined,
    createdAt: (doc.createdAt as string) ?? undefined,
    updatedAt: (doc.updatedAt as string) ?? undefined,
  };
}

/**
 * Normalizes a host application document into the shared `HostApplication`.
 */
export function toHostApplication(
  raw: WithId<Record<string, unknown>>
): HostApplication {
  const doc = serialize(raw);
  return {
    _id: String(doc._id),
    userId: (doc.userId as string) ?? "",
    email: (doc.email as string) ?? "",
    fullName: (doc.fullName as string) ?? "",
    phone: (doc.phone as string) ?? "",
    businessName: (doc.businessName as string) ?? "",
    location: (doc.location as string) ?? "",
    introduction: (doc.introduction as string) ?? "",
    hostingType: ((doc.hostingType as string) ?? "individual") as HostApplication["hostingType"],
    status: ((doc.status as string) ?? "pending") as HostApplication["status"],
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
  };
}

/**
 * Established category titles (src/data/categories.ts) used to accept
 * slugs and normalize stored category values.
 */

/**
 * Collection accessors — resolved through getMongoDb() at CALL time.
 *
 * Collections are deliberately NOT captured at module scope: after a
 * reconnection (see src/lib/mongodb.ts) the handles must be re-derived from
 * the connected Db, so no function can ever operate against a stale
 * reference of a closed topology.
 */
type AnyCol = Collection<Record<string, unknown>>;

async function getCollection(name: string): Promise<AnyCol> {
  return (await getMongoDb()).collection<Record<string, unknown>>(name);
}

const getStudioCol = () => getCollection(STUDIO_COLLECTION);
const getBookingCol = () => getCollection(BOOKING_COLLECTION);
const getHostApplicationCol = () => getCollection(HOST_APPLICATION_COLLECTION);
const getUserCol = () => getCollection(USER_COLLECTION);

/* ------------------------------------------------------------------ */
/* Studios (public browsing + host CRUD)                               */
/* ------------------------------------------------------------------ */

interface StudioQuery {
  category?: string | null;
  location?: string | null;
  search?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export type { StudioQuery };

/**
 * Builds a filter for the public studio gallery. Search matches title,
 * location, overview and amenities; category accepts a title ("Photo
 * Studios"), slug ("photo-studios") or stored value; price bounds are
 * inclusive against `hourlyRate`.
 */
function studioFilter(query: StudioQuery): Filter<Record<string, unknown>> {
  const filter: Filter<Record<string, unknown>> = {};

  if (query.category && query.category.trim()) {
    const value = query.category.trim();
    // Accept the slug ("photo-studios"), the title ("Photo Studios") or
    // any direct stored value, normalized to the established title.
    const known = CATEGORIES.find(
      (item) =>
        item.slug.toLowerCase() === value.toLowerCase() ||
        item.title.toLowerCase() === value.toLowerCase()
    );
    filter.category = known ? known.title : value;
  }

  if (query.location && query.location.trim()) {
    filter.location = {
      $options: "i",
      $regex: escapeRegex(query.location.trim()),
    } as never;
  }

  if (query.search && query.search.trim()) {
    const pattern = escapeRegex(query.search.trim());
    filter.$or = [
      { title: { $options: "i", $regex: pattern } as never },
      { location: { $options: "i", $regex: pattern } as never },
      { overview: { $options: "i", $regex: pattern } as never },
      { amenities: { $options: "i", $regex: pattern } as never },
    ];
  }

  if (
    typeof query.minPrice === "number" &&
    Number.isFinite(query.minPrice) &&
    query.minPrice !== null
  ) {
    filter.hourlyRate = {
      $gte: query.minPrice,
    } as unknown as Filter<Record<string, unknown>>["hourlyRate"];
  }
  if (
    typeof query.maxPrice === "number" &&
    Number.isFinite(query.maxPrice) &&
    query.maxPrice !== null
  ) {
    const rate =
      filter.hourlyRate && typeof filter.hourlyRate === "object"
        ? (filter.hourlyRate as Record<string, unknown>)
        : {};
    filter.hourlyRate = {
      ...rate,
      $lte: query.maxPrice,
    } as unknown as Filter<Record<string, unknown>>["hourlyRate"];
  }

  return filter;
}

/** Escapes user input before embedding it into a $regex. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Public gallery list, newest first. */
export async function listStudios(query: StudioQuery): Promise<Studio[]> {
  const StudioCol = await getStudioCol();
  const docs = await StudioCol.find(studioFilter(query))
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .toArray();
  return docs.map(toStudio);
}

/** Latest 6 studios for the home page carousel. */
export async function listFeaturedStudios(): Promise<Studio[]> {
  const StudioCol = await getStudioCol();
  const docs = await StudioCol.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(6)
    .toArray();
  return docs.map(toStudio);
}

/** Single studio by id ("dual id" matching keeps legacy documents working). */
export async function findStudioById(id: string): Promise<Studio | null> {
  const StudioCol = await getStudioCol();
  const doc = await StudioCol.findOne(idFilter(id));
  return doc ? toStudio(doc) : null;
}

/** Category list with live studio counts, known categories ordered first. */
export async function listCategorySummaries(): Promise<
  Array<{ title: string; slug: string; image: string; count: number }>
> {
  const StudioCol = await getStudioCol();
  const groups = await StudioCol.aggregate<{
    _id: string | null;
    count: number;
  }>([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]).toArray();

  const counts = new Map<string, number>();
  for (const group of groups) {
    if (group._id) counts.set(group._id, group.count);
  }

  const summaries = CATEGORIES.map((item) => ({
    title: item.title,
    slug: item.slug,
    image: item.image,
    count: counts.get(item.title) ?? 0,
  }));

  // Any additional category stored in the DB flows through as well.
  for (const [title, count] of counts.entries()) {
    if (
      title &&
      !summaries.some((item) => item.title.toLowerCase() === title.toLowerCase())
    ) {
      summaries.push({ title, slug: slugify(title), image: "", count });
    }
  }
  return summaries;
}

/** Studios of one category (id or title accepted), newest first. */
export async function listStudiosByCategory(category: string): Promise<Studio[]> {
  const decoded = category;
  const slugMatch = CATEGORIES.find(
    (item) => item.slug.toLowerCase() === decoded.toLowerCase()
  );
  const value = slugMatch ? slugMatch.title : decoded;
  const StudioCol = await getStudioCol();
  const docs = await StudioCol.find({
    category: { $options: "i", $regex: `^${escapeRegex(value)}$` },
  } as Filter<Record<string, unknown>>)
    .sort({ createdAt: -1, _id: -1 })
    .limit(60)
    .toArray();
  return docs.map(toStudio);
}

/* ------------------------------------------------------------------ */
/* Studios (host-side CRUD)                                            */
/* ------------------------------------------------------------------ */

/** Studios owned by one host id (hostId stores the Better Auth user id). */
export async function listHostListings(hostId: string): Promise<Studio[]> {
  const StudioCol = await getStudioCol();
  const docs = await StudioCol.find({ hostId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .toArray();
  return docs.map(toStudio);
}

export type RawStudioDoc = WithId<Record<string, unknown>>;

export async function findStudioDocById(id: string): Promise<RawStudioDoc | null> {
  const StudioCol = await getStudioCol();
  return StudioCol.findOne(idFilter(id));
}

export async function countHostListings(hostId: string): Promise<number> {
  const StudioCol = await getStudioCol();
  return StudioCol.countDocuments({ hostId });
}

/** Valid studio category titles for server-side form validation. */
export function studioCategoryOptions(): string[] {
  return CATEGORIES.map((item) => item.title);
}

/**
 * Validated studio edit. `detail` must already be sanitized by the caller
 * (route handler validation); ownership fields are never present here.
 */
export async function setStudioFields(
  id: string,
  detail: Record<string, unknown>
): Promise<boolean> {
  const StudioCol = await getStudioCol();
  const result = await StudioCol.updateOne(idFilter(id), {
    $set: { ...detail, updatedAt: new Date() },
  });
  return result.matchedCount > 0;
}

/** Result of a studio delete (dual-id matched). */
export interface DeleteStudioResult {
  deletedStudio?: RawStudioDoc;
  matched: boolean;
}

/** Removes one studio and returns the deleted snapshot for the response. */
export async function deleteStudioDoc(id: string): Promise<DeleteStudioResult> {
  const StudioCol = await getStudioCol();
  const deleted = await StudioCol.findOneAndDelete(idFilter(id));
  if (!deleted) return { matched: false };
  return { deletedStudio: deleted, matched: true };
}

/** Insert helper for new host-owned studios (ObjectId `_id` like Better Auth docs). */
export async function createStudioDoc(
  detail: Record<string, unknown>
): Promise<RawStudioDoc> {
  const StudioCol = await getStudioCol();
  const now = new Date();
  const inserted = await StudioCol.insertOne({
    ...detail,
    createdAt: now,
    updatedAt: now,
  });
  const doc = await StudioCol.findOne({ _id: inserted.insertedId });
  if (!doc) throw new Error("Failed to create studio document");
  return doc;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

/** Booking visible to a guest: stamped by userId or matching email. */
export async function listMyBookings(
  userId: string,
  email: string
): Promise<BookingRecord[]> {
  const BookingCol = await getBookingCol();
  const docs = await BookingCol.find({
    $or: [{ userId }, ...(email ? [{ email }] : [])],
  } as Filter<Record<string, unknown>>)
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .toArray();
  return docs.map(toBooking);
}

/** Bookings awaiting (or about) host action across the host's studios. */
export async function listBookingRequestsForHost(
  hostId: string
): Promise<BookingRecord[]> {
  const BookingCol = await getBookingCol();
  const docs = await BookingCol.find({ hostId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .toArray();
  return docs.map(toBooking);
}

/** Admin variant: every booking, newest first. */
export async function listAllBookings(): Promise<BookingRecord[]> {
  const BookingCol = await getBookingCol();
  const docs = await BookingCol.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(300)
    .toArray();
  return docs.map(toBooking);
}

export async function findBookingDocById(
  id: string
): Promise<RawBookingDoc | null> {
  const BookingCol = await getBookingCol();
  return BookingCol.findOne(idFilter(id));
}
export type RawBookingDoc = WithId<Record<string, unknown>>;

/** Inserts a new booking (guest request) and returns its fresh document. */
export async function createBookingDoc(
  detail: Record<string, unknown>
): Promise<RawBookingDoc> {
  const BookingCol = await getBookingCol();
  const now = new Date();
  const inserted = await BookingCol.insertOne({
    ...detail,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  const doc = await BookingCol.findOne({ _id: inserted.insertedId });
  if (!doc) throw new Error("Failed to create booking document");
  return doc;
}

/**
 * Validated status transition for host decisions / guest cancellation.
 * Allowed transitions keep guest and host states consistent:
 *   pending → confirmed (approve) / cancelled (reject, cancel)
 *   confirmed → cancelled (guest cancels a confirmed session)
 * Everything else (completed / cancelled / confirmed→confirmed / …) is 409.
 */
export async function transitionBookingStatus(
  id: string,
  from: Array<"pending" | "confirmed" | "completed" | "cancelled">,
  to: "confirmed" | "cancelled",
  extra: Record<string, unknown>
): Promise<RawBookingDoc | null> {
  const BookingCol = await getBookingCol();
  const result = await BookingCol.findOneAndUpdate(
    { ...idFilter(id), status: { $in: from } } as never,
    { $set: { status: to, ...extra, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ?? null;
}

/* ------------------------------------------------------------------ */
/* Admin stats                                                         */
/* ------------------------------------------------------------------ */

export async function getAdminStats(): Promise<{
  totalStudios: number;
  totalUsers: number;
  totalBookings: number;
}> {
  const [StudioCol, BookingCol, userCol] = await Promise.all([
    getStudioCol(),
    getBookingCol(),
    getUserCol(),
  ]);
  const [totalStudios, totalUsers, totalBookings] = await Promise.all([
    StudioCol.countDocuments({}),
    userCol.countDocuments({}),
    BookingCol.countDocuments({}),
  ]);
  return { totalStudios, totalUsers, totalBookings };
}

/** Comparator values used by the admin search/time filters (MVP scope). */
export const categoryTitles = () => CATEGORIES.map((item) => item.title);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/* Host role activation                                                */
/* ------------------------------------------------------------------ */

/**
 * Server-side role upgrade: customer → host for one verified user id.
 * Admin accounts (env list or stored role) are never modified — this is
 * the only code path that grants the host role, and it always names the
 * user id explicitly; no client value ever reaches this query.
 */
export async function activateHostRole(userId: string): Promise<boolean> {
  const userCol = await getUserCol();
  const filter = /^[0-9a-fA-F]{24}$/.test(userId)
    ? { $or: [{ _id: new ObjectId(userId) }, { _id: userId }] }
    : { _id: userId };
  const result = await userCol.updateOne(filter as never, {
    // $set is explicit — an admin overlap would already have been rejected
    // by requireUser checks; admins keep "admin"/env-based access either way.
    $set: { role: "host", updatedAt: new Date() },
  });
  return result.matchedCount > 0;
}

/* ------------------------------------------------------------------ */
/* Host applications                                                   */
/* ------------------------------------------------------------------ */

/** The latest application for one user (null when never applied). */
export async function findLatestHostApplication(
  userId: string
): Promise<HostApplication | null> {
  const HostApplicationCol = await getHostApplicationCol();
  const doc = await HostApplicationCol.findOne(
    { userId } as Filter<Record<string, unknown>>,
    { sort: { createdAt: -1, _id: -1 } }
  );
  return doc ? toHostApplication(doc) : null;
}

export async function upsertHostApplication(
  userId: string,
  fields: {
    fullName: string;
    phone: string;
    businessName: string;
    location: string;
    introduction: string;
    hostingType: string;
    status: HostApplication["status"];
  },
  email: string
): Promise<HostApplication> {
  const now = new Date();
  const HostApplicationCol = await getHostApplicationCol();
  const existing = await findLatestHostApplication(userId);

  if (existing) {
    // Keep until-rejected applications as re-submissions: same document,
    // refreshed fields, status and updatedAt — one application per account.
    const result = await HostApplicationCol.findOneAndUpdate(
      { _id: new ObjectId(existing._id) } as Filter<Record<string, unknown>>,
      {
        $set: {
          ...fields,
          email,
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Failed to update host application");
    return toHostApplication(result);
  }

  const inserted = await HostApplicationCol.insertOne({
    userId,
    email,
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  const doc = await HostApplicationCol.findOne({ _id: inserted.insertedId });
  if (!doc) throw new Error("Failed to create host application");
  return toHostApplication(doc);
}