// Daily content pipeline: reads the RSS/Atom feeds of active approved sources and adds new headlines
// to story_candidates, where editors turn them into BeeNews stories. Nothing is published automatically.
// Call it from a schedule (see LAUNCH.md) with header  Authorization: Bearer <INGEST_SECRET>,
// or as a signed-in editor from the dashboard.
import { admin, caller, cors, isEditor, json } from "../_shared/util.ts";

const strip = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();
const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml);
  return m ? strip(m[1]) : "";
};
function parseFeed(xml: string) {
  const items: { title: string; url: string; excerpt: string; published_at: string | null }[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks.slice(0, 40)) {
    let url = tag(b, "link");
    if (!/^https?:\/\//.test(url)) {
      const alt = /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i.exec(b) || /<link[^>]*href=["']([^"']+)["']/i.exec(b);
      url = alt ? alt[1] : "";
    }
    const title = tag(b, "title");
    if (!title || !/^https?:\/\//.test(url)) continue;
    const d = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date");
    const t = d ? new Date(d) : null;
    items.push({ title: title.slice(0, 300), url: url.trim(), excerpt: (tag(b, "description") || tag(b, "summary")).slice(0, 1000),
      published_at: t && !isNaN(+t) ? t.toISOString() : null });
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const secret = Deno.env.get("INGEST_SECRET");
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let allowed = !!secret && auth === secret;
  if (!allowed) { const u = await caller(req); allowed = !!u && await isEditor(u.id); }
  if (!allowed) return json({ error: "Not allowed" }, 401);

  const db = admin();
  const { data: sources, error } = await db.from("sources").select("id,name,feed_url").eq("active", true).not("feed_url", "is", null);
  if (error) return json({ error: error.message }, 500);
  const since = Date.now() - 3 * 864e5;           // ignore items older than three days
  const report: Record<string, number | string> = {};
  for (const s of sources || []) {
    try {
      const r = await fetch(s.feed_url!, { headers: { "user-agent": "BeeNewsBot/1.0 (+editorial review queue)" }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) { report[s.name] = `HTTP ${r.status}`; continue; }
      const rows = parseFeed(await r.text())
        .filter((i) => !i.published_at || Date.parse(i.published_at) > since)
        .map((i) => ({ ...i, source_id: s.id }));
      if (!rows.length) { report[s.name] = 0; continue; }
      const { data, error: e2 } = await db.from("story_candidates").upsert(rows, { onConflict: "url", ignoreDuplicates: true }).select("id");
      report[s.name] = e2 ? e2.message : (data?.length ?? 0);
    } catch (e) { report[s.name] = String((e as Error).message || e); }
  }
  // tidy: forget dismissed candidates after 30 days
  await db.from("story_candidates").delete().eq("status", "dismissed").lt("fetched_at", new Date(Date.now() - 30 * 864e5).toISOString());
  return json({ ok: true, added: report });
});
