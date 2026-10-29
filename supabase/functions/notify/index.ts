// Breaking-news alerts: sends a web push notification for one published breaking story
// to every subscriber who follows its section (or all sections). Editors only.
import webpush from "npm:web-push@3.6.7";
import { admin, caller, cors, isEditor, json } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const u = await caller(req);
  if (!u || !(await isEditor(u.id))) return json({ error: "Editors only" }, 403);
  const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!pub || !priv) return json({ error: "VAPID keys are not set" }, 500);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:editor@example.com", pub, priv);

  const { story_id } = await req.json().catch(() => ({}));
  const db = admin();
  const { data: st } = await db.from("stories").select("id,headline,summary,section,translations,breaking,status").eq("id", story_id).maybeSingle();
  if (!st || st.status !== "published") return json({ error: "Story is not published" }, 400);
  const site = Deno.env.get("SITE_URL") || "";
  const { data: subs } = await db.from("push_subscriptions").select("*");
  let sent = 0, removed = 0;
  for (const s of subs || []) {
    if (s.sections?.length && !s.sections.includes(st.section)) continue;
    const tr = (st.translations || {})[s.lang];
    const payload = JSON.stringify({ title: (s.lang === "ar" ? "عاجل · " : "Breaking · ") + ((tr && tr[0]) || st.headline),
      body: (tr && tr[1]) || st.summary, url: `${site}/story/${encodeURIComponent(st.id)}`, tag: st.id });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: "high" });
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) { await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint); removed++; }
    }
  }
  return json({ ok: true, sent, removed });
});
