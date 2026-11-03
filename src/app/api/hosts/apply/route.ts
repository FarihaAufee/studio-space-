import {
  getAuthContext,
  handleRoute,
  jsonError,
  jsonOk,
  validationError,
} from "@/lib/api-server";
import {
  activateHostRole,
  findLatestHostApplication,
  upsertHostApplication,
} from "@/lib/db";

/**
 * POST /api/hosts/apply — Become a Host onboarding submission.
 *
 * Server-side rules:
 *  - Identity comes only from the verified Better Auth session; the request
 *    body never supplies user id, role, admin status, or email.
 *  - Validation returns 400 with per-field messages.
 *  - Duplicate protection: an already-host (or previously approved
 *    application) returns 409; a pending application is surfaced with a
 *    409 instead of allowing duplicate submissions.
 *  - Automatic host activation: a fully validated application is approved
 *    immediately, the account is upgraded customer → host, and the
 *    application is stored as approved.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const auth = await getAuthContext();
    if (!auth) {
      return jsonError(401, "Please sign in to submit a host application.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError(400, "Invalid request body.");
    }

    const errors: Record<string, string> = {};
    const fullName = trimField(body.fullName);
    if (!fullName || fullName.length < 2 || fullName.length > 80) {
      errors.fullName = "Full name is required (2–80 characters).";
    }

    const phone = trimField(body.phone);
    if (!phone || !/^[+\d][\d\s().-]{5,19}$/.test(phone)) {
      errors.phone = "Enter a valid phone number (6–20 characters).";
    }

    const businessName = trimField(body.businessName);
    if (!businessName || businessName.length < 2 || businessName.length > 80) {
      errors.businessName =
        "Business or studio brand name is required (2–80 characters).";
    }

    const location = trimField(body.location);
    if (!location || location.length < 2 || location.length > 120) {
      errors.location = "Studio location is required (2–120 characters).";
    }

    const introduction = trimField(body.introduction);
    if (!introduction || introduction.length < 30 || introduction.length > 600) {
      errors.introduction =
        "Tell us about your hosting experience in 30–600 characters.";
    }

    const hostingType = trimField(body.hostingType);
    if (hostingType !== "individual" && hostingType !== "business") {
      errors.hostingType = "Choose individual or business hosting.";
    }

    if (body.termsAgreed !== true) {
      errors.termsAgreed = "You must agree to the host terms.";
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Duplicate protection — checked against the live account and stored
    // application, never anything supplied by the client.
    if (auth.role === "host") {
      return conflict("You are already a host. Head to your dashboard instead.", {
        alreadyHost: true,
      });
    }

    const existing = await findLatestHostApplication(auth.user.id);
    if (existing && existing.status === "approved") {
      return conflict("You are already a host. Head to your dashboard instead.", {
        alreadyHost: true,
      });
    }
    if (existing && existing.status === "pending") {
      return jsonError(
        409,
        "Your host application is already pending review. You will hear back soon."
      );
    }

    // (Rejected applications fall through — resubmission is allowed and
    // upserts the same document as an approved application.)

    // Automatic host activation: a fully validated application is approved
    // immediately and the account is upgraded customer → host.
    //
    // Every field above either passed validation or produced an error
    // entry; having reached this point each trimmed value is a non-null
    // string, which TS cannot infer from the errors bookkeeping — narrowed
    // explicitly here.
    const fields = {
      fullName: fullName as string,
      phone: phone as string,
      businessName: businessName as string,
      location: location as string,
      introduction: introduction as string,
      hostingType: hostingType as "individual" | "business",
    };

    const application = await upsertHostApplication(
      auth.user.id,
      {
        ...fields,
        status: "approved",
      },
      auth.user.email
    );

    const activated = await activateHostRole(auth.user.id);
    if (!activated) {
      return jsonError(
        409,
        "Your host application could not be activated. Please try again."
      );
    }

    return jsonOk(
      { application, role: "host" },
      "Welcome aboard — you are now a StudioSpace host!",
      201
    );
  });
}

/** Trims a body value into a plain string (objects/arrays become null). */
function trimField(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

/** 409 with optional structured extras (e.g. `alreadyHost`). */
function conflict(
  message: string,
  extra?: Record<string, unknown>
): Response {
  return Response.json(
    extra ? { success: false, message, ...extra } : { success: false, message },
    { status: 409 }
  );
}
