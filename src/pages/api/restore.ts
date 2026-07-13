export const prerender = false;
import type { APIRoute } from "astro";
import { restoreArchiveItem } from "../../lib/notion";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) {
      return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    }
    await restoreArchiveItem(body.id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
