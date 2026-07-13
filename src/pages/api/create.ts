export const prerender = false;
import type { APIRoute } from "astro";
import { createArchiveItem } from "../../lib/notion";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = await createArchiveItem(body);
    return new Response(JSON.stringify({ ok: true, id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
