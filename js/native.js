/* Runs only inside the BeeNews iOS/Android app (added to www/ by tools/build-www.mjs).
   - Google/Apple sign-in opens in the system browser and returns through the ae.beenews.app:// link (PKCE).
   - /story/<id> links open the bundled story page.
   - Share links and email links use the public website address (config.js siteUrl). */
(function(){
"use strict";
const SCHEME = "ae.beenews.app";
const cap = () => window.Capacitor && window.Capacitor.Plugins || {};
window.BN_NATIVE = {
  redirect: SCHEME + "://auth-callback",
  async openAuth(url){ const B = cap().Browser; if(B) await B.open({url, presentationStyle:"popover"}); else location.href = url; }
};
// story links → bundled story page
document.addEventListener("click", e=>{
  const a = e.target.closest && e.target.closest('a[href^="/story/"]');
  if(!a) return;
  e.preventDefault();
  location.href = "/story.html?id=" + encodeURIComponent(a.getAttribute("href").split("/")[2]);
}, true);
// external links → system browser
document.addEventListener("click", e=>{
  const a = e.target.closest && e.target.closest('a[target="_blank"][href^="http"]');
  if(!a || !cap().Browser) return;
  e.preventDefault(); cap().Browser.open({url:a.href});
}, true);
// returning from sign-in: ae.beenews.app://auth-callback?code=...
function handleUrl(url){
  if(!url || !url.startsWith(SCHEME + "://")) return;
  const u = new URL(url.replace(SCHEME + "://", "https://app/"));
  const code = u.searchParams.get("code");
  if(cap().Browser) cap().Browser.close().catch(()=>{});
  if(code && window.BN && BN.sb) BN.sb.auth.exchangeCodeForSession(code).then(({error})=>{ if(error) console.warn("BeeNews: sign-in", error); else location.reload(); });
  const story = u.pathname.match(/\/story\/([A-Za-z0-9_-]+)/);
  if(story) location.href = "/story.html?id=" + story[1];
}
document.addEventListener("DOMContentLoaded", ()=>{
  const App = cap().App;
  if(App){ App.addListener("appUrlOpen", ev=>handleUrl(ev.url)); App.getLaunchUrl().then(r=>r && handleUrl(r.url)).catch(()=>{}); }
});
})();
