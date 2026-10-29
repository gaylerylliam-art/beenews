// Adds the story's headline and summary to /story/<id> so WhatsApp, X, LinkedIn and search engines show a proper preview.
import type { Context } from "https://edge.netlify.com";
import { esc, supabaseConfig } from "../shared/edge-util.ts";

export default async (req: Request, context: Context) => {
  const res = await context.next();
  const id = /^\/story\/([A-Za-z0-9_-]+)\/?$/.exec(new URL(req.url).pathname)?.[1];
  if (!id || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const origin = new URL(req.url).origin;
  const cfg = await supabaseConfig(origin);
  if (!cfg) return res;
  let st: any = null;
  try {
    const r = await fetch(`${cfg.url}/rest/v1/stories?id=eq.${encodeURIComponent(id)}&status=eq.published&select=id,headline,summary,publisher,published_at,section`,
      { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } });
    if (r.ok) st = (await r.json())[0];
  } catch (_) { /* keep the generic preview */ }
  let html = await res.text();
  if (st) {
    const url = `${origin}/story/${encodeURIComponent(st.id)}`;
    const title = `${st.headline} · BeeNews`;
    const desc = `${st.summary} (Source: ${st.publisher})`;
    const og = `<link rel="canonical" href="${esc(url)}">
<meta name="description" content="${esc(desc)}">
<meta property="og:site_name" content="BeeNews">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(st.headline)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(origin)}/images/og-default.png">
<meta property="article:published_time" content="${esc(st.published_at)}">
<meta property="article:section" content="${esc(st.section)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "NewsArticle", headline: st.headline, description: st.summary,
      datePublished: st.published_at, mainEntityOfPage: url, image: [`${origin}/images/og-default.png`],
      publisher: { "@type": "Organization", name: "BeeNews", logo: { "@type": "ImageObject", url: `${origin}/icons/icon-512.png` } },
    }).replace(/</g, "\\u003c")}</script>`;
    html = html.replace(/<!--OG-->[\s\S]*?<!--\/OG-->/, og).replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  } else {
    html = html.replace("<!--OG-->", '<meta name="robots" content="noindex"><!--OG-->');
  }
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  headers.set("netlify-cdn-cache-control", "public, s-maxage=300, stale-while-revalidate=600");
  return new Response(html, { status: st ? 200 : res.status, headers });
};
export const config = { path: "/story/*" };
