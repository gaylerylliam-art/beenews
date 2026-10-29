// /sitemap.xml built from the published stories, so search engines can find every story page.
import { esc, supabaseConfig } from "../shared/edge-util.ts";

export default async (req: Request) => {
  const origin = new URL(req.url).origin;
  const pages = ["/", "/editorial.html", "/corrections.html", "/contact.html", "/privacy.html", "/terms.html"];
  let rows: { id: string; updated_at: string }[] = [];
  const cfg = await supabaseConfig(origin);
  if (cfg) {
    try {
      const r = await fetch(`${cfg.url}/rest/v1/stories?status=eq.published&select=id,updated_at&order=published_at.desc&limit=5000`,
        { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } });
      if (r.ok) rows = await r.json();
    } catch (_) { /* pages only */ }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `<url><loc>${esc(origin + p)}</loc></url>`).join("\n")}
${rows.map((s) => `<url><loc>${esc(`${origin}/story/${encodeURIComponent(s.id)}`)}</loc><lastmod>${esc(s.updated_at)}</lastmod></url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8",
    "netlify-cdn-cache-control": "public, s-maxage=900" } });
};
export const config = { path: "/sitemap.xml" };
