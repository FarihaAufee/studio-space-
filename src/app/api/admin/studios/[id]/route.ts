import { handleRoute, jsonError, jsonOk, requireAdmin } from "@/lib/api-server";
import {
  deleteStudioDoc,
  findStudioDocById,
  setStudioFields,
  toStudio,
} from "@/lib/db";
import { parseStudioPayload } from "@/lib/studio-validation";

/**
 * PUT /api/admin/studios/:id — admin edit for ANY studio, including
 * legacy/demo documents. Detail fields are validated server-side; the
 * display fields hostName/hostEmail may be corrected, but hostId itself
 * is never writable from the request body (ownership is linked in data
 * and derived from sessions, not payloads).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    const { id } = await params;

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

    const doc = await findStudioDocById(id);
    if (!doc) {
      return jsonError(404, "This studio does not exist.");
    }

    // Ownership fields: hostId is immutable; admin may correct the two
    // display/contact fields (trimmed, length-capped).
    const detail: Record<string, unknown> = { ...parsed.value };
    if (typeof body.hostName === "string" && body.hostName.trim()) {
      detail.hostName = body.hostName.trim().slice(0, 80);
    }
    if (
      typeof body.hostEmail === "string" &&
      body.hostEmail.trim() &&
      /^\S+@\S+\.\S+$/.test(body.hostEmail.trim())
    ) {
      detail.hostEmail = body.hostEmail.trim();
    }

    await setStudioFields(id, detail);
    const refreshed = await findStudioDocById(id);

    return jsonOk(refreshed ? toStudio(refreshed) : null, "Studio updated.");
  });
}

/** DELETE /api/admin/studios/:id — admin delete for any studio. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    const { id } = await params;

    const result = await deleteStudioDoc(id);
    if (!result.matched) {
      return jsonError(404, "This studio does not exist.");
    }

    return jsonOk({ _id: id, deleted: true }, "Studio deleted.");
  });
}
