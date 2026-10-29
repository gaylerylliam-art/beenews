// Editor helper: drafts Arabic, French and German translations of a story. Editors only.
// Every draft is reviewed by a person before publishing (see the editorial policy).
import { caller, claude, cors, firstJson, isEditor, json } from "../_shared/util.ts";

const SYSTEM = `You translate short news items for BeeNews, a UAE news app.
Translate faithfully into Modern Standard Arabic, French and German. Keep names, numbers, dates and quotes exact.
Do not add facts, opinions or emphasis. Use a neutral news register suitable for the UAE.
Reply with JSON only: {"ar":{"headline":"","summary":"","brief":""},"fr":{...},"de":{...}}. Leave "brief" empty if no brief was given.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const u = await caller(req);
  if (!u || !(await isEditor(u.id))) return json({ error: "Editors only" }, 403);
  const { task, headline, summary, brief } = await req.json().catch(() => ({}));
  if (task !== "translate" || typeof headline !== "string" || typeof summary !== "string") return json({ error: "Bad request" }, 400);
  if (headline.length > 300 || summary.length > 800 || (brief && String(brief).length > 4000)) return json({ error: "Text too long" }, 400);
  try {
    const out = firstJson(await claude(SYSTEM, JSON.stringify({ headline, summary, brief: brief || "" }), 3000));
    const clean: Record<string, { headline: string; summary: string; brief: string }> = {};
    for (const l of ["ar", "fr", "de"]) {
      const x = out[l] || {};
      clean[l] = { headline: String(x.headline || "").slice(0, 300), summary: String(x.summary || "").slice(0, 800), brief: String(x.brief || "").slice(0, 4000) };
    }
    return json(clean);
  } catch (e) { return json({ error: String((e as Error).message || e) }, 502); }
});
