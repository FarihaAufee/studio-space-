import { ObjectId } from "mongodb";
import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import { createStudioDoc, listStudios, toStudio } from "@/lib/db";
import { parseStudioPayload } from "@/lib/studio-validation";

/**
 * GET /api/studios — public gallery with optional backend filters:
 * category (title or slug), location, search, minPrice, maxPrice.
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const params = new URL(request.url).searchParams;
    const price = (key: string) => {
      const raw = params.get(key);
      if (raw === null || !raw.trim()) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    };

    const studios = await listStudios({
      category: params.get("category"),
      location: params.get("location"),
      search: params.get("search"),
      minPrice: price("minPrice"),
      maxPrice: price("maxPrice"),
    });

    return jsonOk(studios, "Studios loaded.");
  });
}

/**
 * POST /api/studios — publish a new studio listing.
 *
 *  - Requires a signed-in host (or admin); customers are pointed at the
 *    Become a Host onboarding (403).
 *  - All fields are validated server-side (400 with per-field errors).
 *  - Ownership is stamped server-side from the verified session: `hostId`
 *    is the session user id and `hostEmail` the account email. A client
 *    may only suggest the public display name; hostId/hostEmail from the
 *    body are always ignored.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    if (!auth.isHost) {
      return Response.json(
        {
          success: false,
          message:
            "Only hosts can publish studios. Complete the Become a Host onboarding first.",
        },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError(400, "Invalid request body.");
    }

    const parsed = parseStudioPayload(body);
    if (!parsed.ok) {
      return Response.json(
        { success: false, message: parsed.message, errors: parsed.errors },
        { status: 400 }
      );
    }

    // Client-supplied host fields are never authoritative. hostId and
    // hostEmail always come from the verified session; hostName is display
    // text only (falls back to the account name).
    const suggestedHostName =
      typeof body.hostName === "string" && body.hostName.trim()
        ? body.hostName.trim().slice(0, 80)
        : "";

    const doc = await createStudioDoc({
      _id: new ObjectId(),
      ...parsed.value,
      hostId: auth.user.id,
      hostName: suggestedHostName || auth.user.name || "StudioSpace Host",
      hostEmail: auth.user.email,
    });

    return jsonOk(
      toStudio(doc),
      "Studio listed. It is now visible in the gallery.",
      201
    );
  });
}
