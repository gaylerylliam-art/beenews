// Shared helpers for BeeNews edge functions. The Supabase URL and anon key are public values;
// they come from Netlify environment variables, or from /config.js when those are not set.
export async function supabaseConfig(origin: string): Promise<{ url: string; key: string } | null> {
  const env = (k: string) => (globalThis as any).Netlify?.env?.get(k) ?? (globalThis as any).Deno?.env?.get(k);
  let url = env("SUPABASE_URL"), key = env("SUPABASE_ANON_KEY");
  if (!url || !key) {
    try {
      const js = await (await fetch(origin + "/config.js")).text();
      url = url || /supabaseUrl\s*:\s*"([^"]+)"/.exec(js)?.[1];
      key = key || /supabaseAnonKey\s*:\s*"([^"]+)"/.exec(js)?.[1];
    } catch (_) { /* fall through */ }
  }
  return url && key ? { url, key } : null;
}
export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
