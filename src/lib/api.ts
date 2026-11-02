import type { Studio } from "@/app/studios/studios";

/**
 * Server-side API helpers for the StudioSpace backend
 * (base URL: NEXT_PUBLIC_API_URL, e.g. http://localhost:8000/api).
 *
 * Read endpoints are plain cached-per-request fetches; auth-dependent
 * mutations are performed from client components with browser credentials
 * (see the booking/host pages), so this module stays server-safe.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const API_URL = API_BASE_URL;

/** Joins the API base URL with a path that starts with "/". */
export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export async function getStudios() {
  const response = await fetch(`${API_URL}/studios`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch studios");
  }

  const result = await response.json();
  return result.data;
}

/**
 * GET /api/studios with any combination of backend filters:
 * category, location, search, minPrice, maxPrice.
 */
export async function getStudiosFiltered(params: URLSearchParams) {
  const query = params.toString();
  const response = await fetch(`${API_URL}/studios${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch studios");
  }

  const result = await response.json();
  return result.data;
}

export async function getStudiosByCategory(category: string) {
  const response = await fetch(
    `${API_URL}/studios?category=${encodeURIComponent(category)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch category studios");
  }

  const result = await response.json();
  return result.data;
}

/** GET /api/studios/featured — latest 6 studios. */
export async function getFeaturedStudios(): Promise<Studio[]> {
  const response = await fetch(`${API_URL}/studios/featured`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch featured studios");
  }

  const result = await response.json();
  return result.data;
}

/** GET /api/studios/:id — resolves to null on 404/invalid id (400). */
export async function getStudioById(
  id: string
): Promise<Studio | null> {
  try {
    const response = await fetch(apiUrl(`/studios/${id}`), {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * GET /api/categories — the five known StudioSpace categories with live
 * studio counts, plus any additional category stored in the collection.
 */
export async function getCategories() {
  const response = await fetch(`${API_URL}/categories`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const result = await response.json();
  return result.data;
}

/**
 * GET /api/categories/:category/studios — accepts a slug ("photo-studios"),
 * a title ("Photo Studios") or any stored category value.
 */
export async function getCategoryStudios(category: string) {
  const response = await fetch(
    `${API_URL}/categories/${encodeURIComponent(category)}/studios`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch category studios");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Extracts a human-readable message from the backend's consistent
 * `{ success, message, data?, errors? }` envelope. Used by client
 * components so server-side validation and status messages surface
 * verbatim instead of a generic failure.
 */
export function getApiErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string" &&
    (payload as { message: string }).message.trim().length > 0
  ) {
    return (payload as { message: string }).message.trim();
  }
  return fallback;
}

/**
 * Parses an API response body into the envelope, tolerating empty or
 * non-JSON bodies (e.g. gateway errors).
 */
export async function parseApiResponse(
  response: Response
): Promise<{
  ok: boolean;
  status: number;
  data: unknown;
  message: string;
  raw: unknown;
}> {
  let raw: unknown = null;
  try {
    raw = await response.json();
  } catch {
    raw = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: raw && typeof raw === "object" ? (raw as { data?: unknown }).data : null,
    message: getApiErrorMessage(
      raw,
      "Something went wrong. Please try again."
    ),
    raw,
  };
}
