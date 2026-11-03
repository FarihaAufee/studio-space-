import { handleRoute, jsonOk } from "@/lib/api-server";
import { listFeaturedStudios } from "@/lib/db";

/** GET /api/studios/featured — latest 6 studios for the home page. */
export async function GET() {
  return handleRoute(async () => {
    const studios = await listFeaturedStudios();
    return jsonOk(studios, "Featured studios loaded.");
  });
}
