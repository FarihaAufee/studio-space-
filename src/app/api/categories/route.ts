import { handleRoute, jsonOk } from "@/lib/api-server";
import { listCategorySummaries } from "@/lib/db";

/**
 * GET /api/categories — the established StudioSpace categories with live
 * studio counts, plus any additional category stored in the collection.
 */
export async function GET() {
  return handleRoute(async () => {
    const categories = await listCategorySummaries();
    return jsonOk(categories, "Categories loaded.");
  });
}
