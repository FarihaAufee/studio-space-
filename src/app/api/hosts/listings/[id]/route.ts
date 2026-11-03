import { handleRoute, jsonError, jsonOk, requireHost } from "@/lib/api-server";
import {
  deleteStudioDoc,
  findStudioDocById,
  setStudioFields,
  toStudio,
} from "@/lib/db";
import { parseStudioPayload } from "@/lib/studio-validation";

/**
 * PUT /api/hosts/listings/:id — edit one of the host's own studios.
 *
 *  - 401 unauthenticated, 403 for pure customers, 404 for unknown ids.
 *  - Ownership check: the stored `hostId` must equal the session user id;
 *    admins may additionally edit any studio, including legacy documents
 *    without a host id.
 *  - Ownership fields (hostId / hostName / hostEmail) are removed from the
 *    payload before any write — ownership cannot be transferred by a host
 *    through the API.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireHost();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;
    const { id } = await params;

    // Existence first, then body validation — a request for a studio that
    // is not there should always be a 404 regardless of payload quality.
    const doc = await findStudioDocById(id);
    if (!doc) {
      return jsonError(404, "This studio does not exist.");
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

    const ownerId = typeof doc.hostId === "string" ? doc.hostId : "";
    if (!ownerId) {
      // Legacy/demo documents with no host id stay admin-managed only.
      if (!auth.isAdmin) {
        return jsonError(
          403,
          "Legacy listings without a linked host can only be managed by an admin."
        );
      }
    } else if (ownerId !== auth.user.id && !auth.isAdmin) {
      return jsonError(
        403,
        "You can only edit studios that you listed yourself."
      );
    }

    // Ownership fields stripped: hosts (and admins using this endpoint)
    // can only change the listing details.
    const { hostId, hostName, hostEmail, ...detail } =
      parsed.value as unknown as Record<string, unknown>;
    void hostId;
    void hostName;
    void hostEmail;

    await setStudioFields(id, detail);
    const refreshed = await findStudioDocById(id);

    return jsonOk(
      refreshed ? toStudio(refreshed) : null,
      "Listing updated."
    );
  });
}

/**
 * DELETE /api/hosts/listings/:id — remove one of the host's own studios.
 * Same ownership rules as the PUT (admin bypasses for legacy documents).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireHost();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;
    const { id } = await params;

    const doc = await findStudioDocById(id);
    if (!doc) {
      return jsonError(404, "This studio does not exist.");
    }

    const ownerId = typeof doc.hostId === "string" ? doc.hostId : "";
    if (!ownerId && !auth.isAdmin) {
      return jsonError(
        403,
        "Legacy listings without a linked host can only be managed by an admin."
      );
    }
    if (ownerId && ownerId !== auth.user.id && !auth.isAdmin) {
      return jsonError(
        403,
        "You can only delete studios that you listed yourself."
      );
    }

    const result = await deleteStudioDoc(id);
    if (!result.matched) {
      return jsonError(404, "This studio does not exist.");
    }

    return jsonOk(
      { _id: id, deleted: true },
      "Listing deleted."
    );
  });
}
