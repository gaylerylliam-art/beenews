// "Ask BeeNews": a signed-in reader describes what they want ("more AI and Saudi news, read me today's top health stories")
// and gets back homepage settings to confirm and/or stories to play. It never invents news: it only picks from the
// published stories passed to it, and its suggestions are validated against fixed lists before being returned.
import { admin, caller, claude, cors, firstJson, json } from "../_shared/util.ts";

const SECTIONS = ["AI", "GCC", "Health & Wellness", "Sports & Events", "Politics", "Cars"];
const COUNTRIES = ["UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Morocco", "Philippines", "International"];
const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const LANGS = ["en", "ar", "fr", "de"];
const DAILY_LIMIT = Number(Deno.env.get("ASK_DAILY_LIMIT") || 20);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const u = await caller(req);
  if (!u) return json({ error: "Please sign in to use Ask BeeNews." }, 401);
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 500);
  const lang = LANGS.includes(body.lang) ? body.lang : "en";
  const currencies: string[] = Array.isArray(body.currencyCodes) ? body.currencyCodes.filter((c: unknown) => /^[A-Z]{3}$/.test(String(c))).slice(0, 30) : [];
  if (message.length < 2) return json({ error: "Please type a request." }, 400);

  const db = admin();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
  const { data: use } = await db.from("assistant_usage").select("count").eq("user_id", u.id).eq("day", day).maybeSingle();
  if ((use?.count ?? 0) >= DAILY_LIMIT) return json({ error: "You've reached today's Ask BeeNews limit. Try again tomorrow." }, 429);
  await db.from("assistant_usage").upsert({ user_id: u.id, day, count: (use?.count ?? 0) + 1 });

  const { data: stories } = await db.from("stories").select("id,section,country,headline,published_at")
    .eq("status", "published").order("published_at", { ascending: false }).limit(60);
  const ids = new Set((stories || []).map((s) => s.id));

  const system = `You are the BeeNews assistant inside a UAE news app. You help a reader set up their homepage and choose stories to listen to.
You can ONLY:
1. suggest homepage settings, using these exact values: sections ${JSON.stringify(SECTIONS)}, countries ${JSON.stringify(COUNTRIES)},
   language ${JSON.stringify(LANGS)}, horoscope_sign ${JSON.stringify(SIGNS)} or null, currencies from ${JSON.stringify(currencies)};
2. pick up to 8 stories to read aloud, using ids from the STORIES list only.
Never write news, facts or opinions yourself, and never give financial, medical, legal or religious advice; say briefly that you can't help with that.
Reply in the reader's language (${lang}) with JSON only:
{"reply":"one or two short sentences","prefs":null or {"sections":[],"countries":[],"language":null,"horoscope_sign":null,"currencies":[]},"play":[]}
Only include "prefs" when the reader asks to change their homepage; include only the fields they asked about, others null.`;
  const user = `STORIES:\n${(stories || []).map((s) => `${s.id} | ${s.section} | ${s.country} | ${s.headline}`).join("\n")}\n\nREADER: ${message}`;
  try {
    const out = firstJson(await claude(system, user, 800));
    const p = out.prefs && typeof out.prefs === "object" ? out.prefs : null;
    const pick = (arr: unknown, allowed: string[]) => Array.isArray(arr) ? [...new Set(arr.map(String).filter((x) => allowed.includes(x)))] : null;
    const prefs = p ? {
      sections: pick(p.sections, SECTIONS), countries: pick(p.countries, COUNTRIES),
      language: LANGS.includes(p.language) ? p.language : null,
      horoscope_sign: SIGNS.includes(p.horoscope_sign) ? p.horoscope_sign : null,
      currencies: pick(p.currencies, currencies),
    } : null;
    const play = Array.isArray(out.play) ? out.play.map(String).filter((id: string) => ids.has(id)).slice(0, 8) : [];
    return json({ reply: String(out.reply || "").slice(0, 400), prefs, play });
  } catch (e) {
    console.error(e);
    return json({ error: "Ask BeeNews is unavailable right now." }, 502);
  }
});
