/* BeeNews sub-page shell: header, footer, language, theme, Supabase client. */
(function(){
"use strict";
const LANGS = ["en","ar","fr","de"];
const store = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v===null ? d : JSON.parse(v); }catch(e){ try{ return localStorage.getItem(k) || d; }catch(_){ return d; } } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let lang = (()=>{ try{ return localStorage.getItem("beenews-lang"); }catch(e){ return null; } })();
if(!LANGS.includes(lang)) lang = "en";
const theme = store.get("beenews-theme", null);
const root = document.documentElement;
if(theme === "dark" || theme === "light") root.dataset.theme = theme;

const UI = {
  en:{back:"Back to BeeNews", privacy:"Privacy policy", terms:"Terms of use", editorial:"Editorial policy", contact:"Contact", corrections:"Corrections",
      themeDark:"Dark mode", themeLight:"Light mode", docLangNote:"This page is available in English and Arabic.", licence:"Media licence: application in progress",
      draft:"Draft for legal review. This text must be checked by a UAE-qualified lawyer before launch. Items in highlighted brackets still need your details."},
  ar:{back:"العودة إلى بي نيوز", privacy:"سياسة الخصوصية", terms:"شروط الاستخدام", editorial:"السياسة التحريرية", contact:"اتصل بنا", corrections:"التصحيحات",
      themeDark:"الوضع الداكن", themeLight:"الوضع الفاتح", docLangNote:"هذه الصفحة متاحة بالعربية والإنجليزية.", licence:"الترخيص الإعلامي: الطلب قيد الإجراء",
      draft:"مسودة للمراجعة القانونية. يجب أن يراجع هذا النص محامٍ مؤهل في الإمارات قبل الإطلاق. البنود المظللة بين أقواس تحتاج إلى بياناتك."},
  fr:{back:"Retour à BeeNews", privacy:"Confidentialité", terms:"Conditions d'utilisation", editorial:"Politique éditoriale", contact:"Contact", corrections:"Corrections",
      themeDark:"Mode sombre", themeLight:"Mode clair", docLangNote:"Cette page est disponible en anglais et en arabe.", licence:"Licence média : demande en cours",
      draft:"Projet soumis à relecture juridique. Ce texte doit être vérifié par un avocat habilité aux EAU avant le lancement."},
  de:{back:"Zurück zu BeeNews", privacy:"Datenschutz", terms:"Nutzungsbedingungen", editorial:"Redaktionsrichtlinien", contact:"Kontakt", corrections:"Korrekturen",
      themeDark:"Dunkelmodus", themeLight:"Hellmodus", docLangNote:"Diese Seite ist auf Englisch und Arabisch verfügbar.", licence:"Medienlizenz: Antrag läuft",
      draft:"Entwurf zur rechtlichen Prüfung. Dieser Text muss vor dem Start von einem in den VAE zugelassenen Anwalt geprüft werden."}
};
const extra = {};
const t = k => (extra[lang] && extra[lang][k]) || (UI[lang] && UI[lang][k]) || (extra.en && extra.en[k]) || UI.en[k] || k;
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);

function logos(cls, h){
  const out = [];
  for(const [k,w,alt] of [["en",168,"BeeNews — Bee The First To Know"],["ar",143,"بي نيوز — كن أول من يعرف"]])
    for(const [v,vc] of [["","lt"],["-dark","dk"]])
      out.push(`<img class="${cls} lg-${k} ${vc}" src="/images/logo-${k}${v}-120.webp" srcset="/images/logo-${k}${v}-120.webp 1x, /images/logo-${k}${v}-240.webp 2x, /images/logo-${k}${v}-360.webp 3x" width="${Math.round(w*h/120)}" height="${h}" alt="${vc==="lt"?alt:""}">`);
  return out.join("");
}
function currentTheme(){ return root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }

function renderShell(){
  root.lang = lang; root.dir = lang==="ar" ? "rtl" : "ltr";
  const head = $("pgHead");
  if(head){
    const dark = currentTheme()==="dark";
    head.className = "pg-head";
    head.innerHTML = `<div class="wrap">
      <a class="pg-logo" href="/" aria-label="BeeNews">${logos("",64)}</a>
      <a class="pg-back" href="/"><i class="fa-solid fa-arrow-${lang==="ar"?"right":"left"}" aria-hidden="true"></i><span>${esc(t("back"))}</span></a>
      <div class="pg-tools">
        <div class="pg-lang" role="group" aria-label="Language">${LANGS.map(l=>`<button type="button" data-l="${l}" lang="${l}" aria-pressed="${l===lang}">${l==="ar"?"عربي":l.toUpperCase()}</button>`).join("")}</div>
        <button type="button" class="iconbtn" id="pgTheme" aria-label="${esc(dark?t("themeLight"):t("themeDark"))}" title="${esc(dark?t("themeLight"):t("themeDark"))}"><i class="fa-solid ${dark?"fa-sun":"fa-moon"}" aria-hidden="true"></i></button>
      </div></div>`;
    head.querySelector(".pg-lang").onclick = e=>{ const b=e.target.closest("[data-l]"); if(b) setLang(b.dataset.l); };
    $("pgTheme").onclick = ()=>{ const n = currentTheme()==="dark" ? "light" : "dark"; root.dataset.theme = n; store.set("beenews-theme", n); renderShell(); };
  }
  const foot = $("pgFoot");
  if(foot){
    foot.className = "pg-foot";
    foot.innerHTML = `<div class="wrap">
      <a href="/privacy.html">${esc(t("privacy"))}</a><a href="/terms.html">${esc(t("terms"))}</a><a href="/editorial.html">${esc(t("editorial"))}</a>
      <a href="/corrections.html">${esc(t("corrections"))}</a><a href="/contact.html">${esc(t("contact"))}</a>
      <span>© 2026 BeeNews UAE · ${esc(t("licence"))}</span></div>`;
  }
  // legal documents: show the matching language block (fallback: English)
  const blocks = document.querySelectorAll("[data-doc-lang]");
  if(blocks.length){
    const has = [...blocks].some(b=>b.dataset.docLang===lang);
    blocks.forEach(b=>{ b.style.display = (b.dataset.docLang===(has?lang:"en")) ? "block" : "none"; });
    const note = $("docLangNote"); if(note){ note.hidden = has; note.textContent = t("docLangNote"); }
  }
  const dr = $("pgDraft"); if(dr) dr.querySelector("span").textContent = t("draft");
  document.querySelectorAll("[data-t]").forEach(el=>{ el.textContent = t(el.dataset.t); });
  document.querySelectorAll("[data-tp]").forEach(el=>{ el.placeholder = t(el.dataset.tp); });
  if(window.BNP && BNP.onLang) BNP.onLang(lang);
}
function setLang(l){ if(!LANGS.includes(l)) return; lang = l; try{ localStorage.setItem("beenews-lang", l); }catch(e){} renderShell(); }

const CFG = window.BEENEWS_CONFIG || {};
const sb = (CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, detectSessionInUrl:!window.BN_NATIVE, flowType:window.BN_NATIVE?"pkce":"implicit"}}) : null;

window.BNP = {
  get lang(){ return lang; }, t, esc, $, sb, store, setLang, logos, addStrings(d){ for(const l in d) extra[l] = Object.assign(extra[l]||{}, d[l]); },
  render: renderShell, onLang: null
};
document.addEventListener("DOMContentLoaded", renderShell);
if(document.readyState !== "loading") renderShell();
})();
