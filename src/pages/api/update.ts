export const prerender = false;
import type { APIRoute } from "astro";
import {
  updateTextField,
  updateTitleField,
  updateDateField,
  addToTags,
  removeTagFromAnyProperty,
} from "../../lib/notion";

// field 이름 -> [Notion 속성명, 타입]
const FIELD_MAP: Record<string, { prop: string; kind: "text" | "title" | "date" }> = {
  marketingGoal: { prop: "마케팅 목표", kind: "text" },
  problem: { prop: "문제점", kind: "text" },
  solution: { prop: "솔루션", kind: "text" },
  note: { prop: "Note", kind: "text" },
  companyName: { prop: "회사명", kind: "text" },
  productName: { prop: "제품명", kind: "title" },
  subtitle: { prop: "소제목", kind: "text" },
  releaseDate: { prop: "공개일자", kind: "date" },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, type } = body;

    if (type === "text") {
      const conf = FIELD_MAP[body.field];
      if (!conf) {
        return new Response(JSON.stringify({ error: "invalid field" }), { status: 400 });
      }
      if (conf.kind === "title") {
        await updateTitleField(id, conf.prop, body.value ?? "");
      } else if (conf.kind === "date") {
        await updateDateField(id, conf.prop, body.value ?? "");
      } else {
        await updateTextField(id, conf.prop, body.value ?? "");
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (type === "addTag") {
      await addToTags(id, body.tag);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (type === "removeTag") {
      await removeTagFromAnyProperty(id, body.tag);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "invalid type" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
