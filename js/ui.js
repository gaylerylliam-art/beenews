/* BeeNews page UI: theme toggle, search, read-aloud player, saved stories, UAE weather and prayer times.
   Loaded after the main script and backend.js; uses their globals (S, EV, T, lang, t, esc, selectTab, ...). */
(function(){
"use strict";
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v===null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const note = (a,b)=>{ if(window.BN && BN.toast) BN.toast(a,b); };
const setLabels = ()=>{
  document.querySelectorAll(".wordmark").forEach(w=>{ w.innerHTML = lang==="ar" ? "<b>بي</b><em> نيوز</em>" : "<b>Bee</b><em>News</em>"; });
  document.querySelectorAll("[data-al]").forEach(b=>{ const l=t(b.dataset.al); b.setAttribute("aria-label", l); b.title = l; });
  $("searchBtn").setAttribute("aria-label", t("searchLabel")); $("searchBtn").title = t("searchLabel");
  setThemeIcon();
};

/* ---------------- theme ---------------- */
const root = document.documentElement;
function currentTheme(){ return root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
function setThemeIcon(){
  const dark = currentTheme()==="dark", b = $("themeBtn");
  b.innerHTML = `<i class="fa-solid ${dark?"fa-sun":"fa-moon"}" aria-hidden="true"></i>`;
  const l = dark ? t("themeLight") : t("themeDark"); b.setAttribute("aria-label", l); b.title = l;
}
const savedTheme = store.get("beenews-theme", null);
if(savedTheme) root.dataset.theme = savedTheme;
$("themeBtn").addEventListener("click", ()=>{
  const next = currentTheme()==="dark" ? "light" : "dark";
  root.dataset.theme = next; store.set("beenews-theme", next); setThemeIcon();
});

/* ---------------- saved stories ---------------- */
function toggleSave(id){
  const on = !SAVED.has(id);
  on ? SAVED.add(id) : SAVED.delete(id);
  store.set("beenews-saved", [...SAVED]);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach(b=>{
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    b.innerHTML = `<i class="${on?"fa-solid":"fa-regular"} fa-bookmark" aria-hidden="true"></i>`;
  });
  note(on ? t("saved") : t("removed"));
  if(window.BN && BN.refresh) BN.refresh();
}

/* ---------------- read-aloud player ---------------- */
const synth = window.speechSynthesis;
const VOICE_LANG = {en:"en", ar:"ar", fr:"fr", de:"de"};
const PREFERRED = {en:["en-GB","en-US","en-AU","en"], ar:["ar-AE","ar-SA","ar"], fr:["fr-FR","fr"], de:["de-DE","de"]};
let queue = [], qi = 0, rate = 1, playing = false, utter = null;
function pickVoice(l){
  const vs = synth ? synth.getVoices() : [];
  for(const tag of PREFERRED[l]||[l]){ const v = vs.find(v=>v.lang && v.lang.replace("_","-").toLowerCase().startsWith(tag.toLowerCase())); if(v) return v; }
  return null;
}
const storyText = st => `${SH(st)}. ${SS(st)} ${t("sourceL")}: ${st.pub}.`;
function speakCurrent(){
  const st = queue[qi]; if(!st) return stop();
  synth.cancel();
  const text = storyText(st);
  utter = new SpeechSynthesisUtterance(text);
  utter.lang = ({en:"en-GB",ar:"ar-AE",fr:"fr-FR",de:"de-DE"})[lang] || "en-GB";
  const v = pickVoice(VOICE_LANG[lang]); if(v) utter.voice = v;
  utter.rate = rate;
  utter.onboundary = e => { if(e.charIndex!=null) $("plProg").style.width = Math.min(100, (e.charIndex/text.length)*100)+"%"; };
  utter.onend = ()=>{ if(!playing) return; $("plProg").style.width = "100%"; if(qi < queue.length-1){ qi++; speakCurrent(); } else { playing=false; renderPlayer(); } };
  utter.onerror = ()=>{};
  $("plProg").style.width = "0%";
  playing = true; renderPlayer();
  synth.speak(utter);
}
function renderPlayer(){
  const st = queue[qi]; if(!st) return;
  $("player").hidden = false;
  $("plTitle").textContent = SH(st);
  $("plSub").textContent = `${st.pub} · ${t("readBy")}`;
  $("plQueue").textContent = queue.length>1 ? t("queueOf").replace("{i}", qi+1).replace("{n}", queue.length) : "";
  $("plPlay").innerHTML = `<i class="fa-solid ${playing&&!synth.paused?"fa-pause":"fa-play"}" aria-hidden="true"></i>`;
  $("plPlay").setAttribute("aria-label", playing&&!synth.paused ? t("pause") : t("play"));
  $("plSpeed").textContent = (rate===1?"1.0":String(rate))+"×";
  document.querySelectorAll("[data-listen]").forEach(b=>b.classList.toggle("speaking", playing && b.dataset.listen===st.id));
  document.body.classList.add("has-player");
}
function play(list, start){
  if(!synth){ note(t("noVoice")); return; }
  queue = list.filter(Boolean); qi = start||0; if(!queue.length) return;
  speakCurrent();
}
function stop(){
  playing = false; if(synth) synth.cancel();
  $("player").hidden = true; document.body.classList.remove("has-player");
  document.querySelectorAll("[data-listen].speaking").forEach(b=>b.classList.remove("speaking"));
}
const byId = id => S.find(x=>x.id===id);
function visibleList(){
  const ids = [...document.querySelectorAll("#leadwrap [data-id], #grid .card[data-id]")].map(e=>e.dataset.id);
  return [...new Set(ids)].map(byId).filter(Boolean).slice(0,12);
}
$("plPlay").addEventListener("click", ()=>{
  if(!queue.length) return;
  if(!playing){ speakCurrent(); return; }
  if(synth.paused){ synth.resume(); } else { synth.pause(); }
  setTimeout(renderPlayer, 50);
});
$("plRestart").addEventListener("click", ()=>{ if(queue.length) speakCurrent(); });
$("plNext").addEventListener("click", ()=>{ if(qi < queue.length-1){ qi++; speakCurrent(); } });
$("plClose").addEventListener("click", stop);
$("plSpeed").addEventListener("click", ()=>{ const steps=[1,1.25,1.5,0.75]; rate = steps[(steps.indexOf(rate)+1)%steps.length]; if(playing) speakCurrent(); else renderPlayer(); });
if(synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = ()=>{};
if(!synth) document.documentElement.classList.add("no-tts");

/* ---------------- search ---------------- */
const ov = $("searchOv"), sin = $("searchIn");
function openSearch(){ ov.hidden = false; document.body.classList.add("noscroll"); sin.value = state.q || ""; renderSearch(); setTimeout(()=>sin.focus(), 30); }
function closeSearch(){ ov.hidden = true; document.body.classList.remove("noscroll"); $("searchBtn").focus(); }
function renderSearch(){
  const q = sin.value.trim().toLowerCase();
  const chips = ["Sharjah","Hilux","Morocco","Philippines","WHO","Gulf Cup","Louvre"];
  $("searchChips").innerHTML = chips.map(c=>`<button type="button" class="sb-chip" data-q="${esc(c)}">${esc(c)}</button>`).join("");
  if(!q){ $("searchRes").innerHTML = ""; return; }
  const hits = S.filter(st=>(SH(st)+" "+SS(st)+" "+st.h+" "+st.pub+" "+secName(st.sec)+" "+ctry(st.country)).toLowerCase().includes(q)).slice(0,8);
  const evHits = EV.filter(e=>(EN(e)+" "+e.n+" "+e.venue).toLowerCase().includes(q)).slice(0,3);
  if(!hits.length && !evHits.length){ $("searchRes").innerHTML = `<li class="sb-none">${esc(t("noResults"))}</li>`; return; }
  $("searchRes").innerHTML = hits.map(st=>`<li class="sc-${SECCLS[st.sec]}"><span class="sb-ic"><i class="fa-solid ${SECICON[st.sec]}" aria-hidden="true"></i></span>
      <a href="${esc(st.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(SH(st))}</b><small>${esc(secName(st.sec))} · ${esc(st.pub)} · ${ago(st)}</small></a>
      <button type="button" class="act listen sm" data-listen="${esc(st.id)}" aria-label="${esc(t("listen"))}"><i class="fa-solid fa-volume-high" aria-hidden="true"></i></button></li>`).join("")
    + evHits.map(e=>`<li class="sc-events"><span class="sb-ic"><i class="fa-solid fa-masks-theater" aria-hidden="true"></i></span>
      <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(EN(e))}</b><small>${esc(t("evTitle"))} · ${esc(evWhen(e))}</small></a></li>`).join("");
}
$("searchBtn").addEventListener("click", openSearch);
$("searchClose").addEventListener("click", closeSearch);
ov.addEventListener("click", e=>{ if(e.target===ov) closeSearch(); });
sin.addEventListener("input", renderSearch);
sin.addEventListener("keydown", e=>{
  if(e.key==="Escape") closeSearch();
  if(e.key==="Enter"){ state.q = sin.value.trim(); $("q").value = state.q; closeSearch(); selectTab("All");
    const y = $("gridHead").getBoundingClientRect().top + scrollY - $("rail").offsetHeight - 10; scrollTo({top:y, behavior:"smooth"}); }
});
$("searchChips").addEventListener("click", e=>{ const c = e.target.closest("[data-q]"); if(c){ sin.value = c.dataset.q; renderSearch(); sin.focus(); } });
document.addEventListener("keydown", e=>{ if(e.key==="/" && !/input|textarea|select/i.test(document.activeElement.tagName) && ov.hidden){ e.preventDefault(); openSearch(); } });

/* ---------------- UAE weather and prayer times ---------------- */
const CITIES = {
  "Dubai":[25.2048,55.2708], "Abu Dhabi":[24.4539,54.3773], "Sharjah":[25.3463,55.4209], "Al Ain":[24.2075,55.7447],
  "Ajman":[25.4052,55.5136], "Ras Al Khaimah":[25.8007,55.9762], "Fujairah":[25.1288,56.3265], "Umm Al Quwain":[25.5647,55.5552]
};
let city = store.get("beenews-city", "Dubai"); if(!CITIES[city]) city = "Dubai";
let wx = null, wxErr = false;
const WXMAP = c => c===0?["wx0","fa-sun"]:c===1?["wx1","fa-sun"]:c===2?["wx2","fa-cloud-sun"]:c===3?["wx3","fa-cloud"]:
  (c===45||c===48)?["wx45","fa-smog"]:(c>=51&&c<=57)?["wx51","fa-cloud-rain"]:(c>=61&&c<=67)?["wx61","fa-cloud-showers-heavy"]:
  (c>=80&&c<=82)?["wx80","fa-cloud-sun-rain"]:(c>=95)?["wx95","fa-cloud-bolt"]:["wx3","fa-cloud"];
function dubaiNow(){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Dubai",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",hour12:false})
    .formatToParts(new Date()).map(x=>[x.type,x.value]));
  return {y:+p.year, m:+p.month, d:+p.day, mins:(+p.hour%24)*60 + +p.minute};
}
const PRAYERS = ["fajr","sunrise","dhuhr","asr","maghrib","isha"];
function prayerTimes(){ const n = dubaiNow(); const [la,lo] = CITIES[city]; return {n, tt: BeePray.times({y:n.y,m:n.m,d:n.d}, la, lo, 4, "UAE")}; }
const hm = ({h,m}) => new Intl.DateTimeFormat(LOC[lang],{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(Date.UTC(2026,0,1,h,m));
function nextPrayer(){
  const {n, tt} = prayerTimes();
  for(const k of PRAYERS){ if(k==="sunrise") continue; const v = tt[k]; if(v.h*60+v.m > n.mins) return [k, v]; }
  return ["fajr", tt.fajr];
}
function renderPray(){
  const [k,v] = nextPrayer();
  $("prayNext").innerHTML = `${esc(t(k))} <bdi>${esc(hm(v))}</bdi><span class="pr-city"> · ${esc(t("city"+city))}</span>`;
  $("prayBtn").setAttribute("aria-label", `${t("prayer")}: ${t(k)} ${hm(v)}`);
}
function renderWx(){
  $("wxMain").innerHTML = wx ? `${esc(t("city"+city))} <bdi dir="ltr">${Math.round(wx.temp)}°C</bdi>` : esc(t("city"+city));
  if(wx){ const [lab, icon] = WXMAP(wx.code); $("wxSub").textContent = t(lab) + (wx.aqi!=null ? ` · AQI ${Math.round(wx.aqi)}` : "");
          $("wxIcon").innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`; }
  else $("wxSub").textContent = wxErr ? t("wxUnavailable") : "…";
  if(!$("wxPanel").hidden) renderPanel();
}
function renderPanel(){
  const {tt} = prayerTimes(); const [nk] = nextPrayer();
  const opts = Object.keys(CITIES).map(c=>`<option value="${esc(c)}"${c===city?" selected":""}>${esc(t("city"+c))}</option>`).join("");
  const [lab, icon] = wx ? WXMAP(wx.code) : ["wxUnavailable","fa-cloud"];
  $("wxPanel").innerHTML = `
    <label class="wp-city">${esc(t("emirateSel"))}<select id="wxCity">${opts}</select></label>
    <div class="wp-now"><span class="wp-ic"><i class="fa-solid ${icon}" aria-hidden="true"></i></span>
      <div><b>${wx?Math.round(wx.temp)+"°C":"—"}</b><span>${esc(t(lab))}</span></div>
      ${wx?`<dl><dt>${esc(t("feels"))}</dt><dd>${Math.round(wx.feels)}°C</dd><dt>${esc(t("humidity"))}</dt><dd>${Math.round(wx.hum)}%</dd><dt>${esc(t("wind"))}</dt><dd>${Math.round(wx.wind)} km/h</dd>${wx.aqi!=null?`<dt>${esc(t("aqi"))}</dt><dd>${Math.round(wx.aqi)}</dd>`:""}</dl>`:""}</div>
    <h4><i class="fa-solid fa-moon" aria-hidden="true"></i> ${esc(t("prayer"))}</h4>
    <ul class="wp-pray">${PRAYERS.map(k=>`<li class="${k===nk?"next":""}"><span>${esc(t(k))}${k===nk?` <em>${esc(t("nextPrayer"))}</em>`:""}</span><b>${hm(tt[k])}</b></li>`).join("")}</ul>
    <p class="wp-note">${esc(t("prCalc").replace("{c}", t("city"+city)))} · ${esc(t("wxSource"))}</p>`;
  $("wxCity").onchange = e=>{ city = e.target.value; store.set("beenews-city", city); wx = null; renderPray(); renderWx(); loadWx(); };
}
function togglePanel(force){
  const p = $("wxPanel"), open = force!==undefined ? force : p.hidden;
  p.hidden = !open; $("wxBtn").setAttribute("aria-expanded", open);
  if(open) renderPanel();
}
$("wxBtn").addEventListener("click", e=>{ e.stopPropagation(); togglePanel(); });
$("prayBtn").addEventListener("click", e=>{ e.stopPropagation(); togglePanel(true); $("wxBtn").scrollIntoView({block:"nearest"}); });
document.addEventListener("click", e=>{ if(!$("wxPanel").hidden && !e.target.closest("#wxPanel")) togglePanel(false); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !$("wxPanel").hidden) togglePanel(false); });
async function loadWx(){
  const [la,lo] = CITIES[city];
  try{
    const ctl = new AbortController(); setTimeout(()=>ctl.abort(), 10000);
    const [w, a] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FDubai`, {signal:ctl.signal}).then(r=>r.ok?r.json():Promise.reject(r.status)),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${la}&longitude=${lo}&current=us_aqi&timezone=Asia%2FDubai`, {signal:ctl.signal}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]);
    const c = w.current;
    wx = {temp:c.temperature_2m, feels:c.apparent_temperature, hum:c.relative_humidity_2m, code:c.weather_code, wind:c.wind_speed_10m, aqi: a && a.current ? a.current.us_aqi : null};
    wxErr = false;
  }catch(e){ wxErr = true; console.warn("BeeNews: weather unavailable", e); }
  renderWx();
}

/* ---------------- clicks across the page ---------------- */
document.addEventListener("click", e=>{
  const l = e.target.closest("[data-listen]");
  if(l){ e.preventDefault(); const st = byId(l.dataset.listen);
    if(playing && queue[qi] && queue[qi].id===l.dataset.listen){ stop(); return; }
    const list = visibleList(); const i = list.findIndex(x=>x.id===l.dataset.listen);
    i>=0 ? play(list, i) : play([st]); return; }
  const sv = e.target.closest("[data-save]"); if(sv){ e.preventDefault(); toggleSave(sv.dataset.save); return; }
  const pl = e.target.closest("[data-playlist]"); if(pl){ play(visibleList()); return; }
  const fy = e.target.closest('[data-play="fy"]'); if(fy){ play([...document.querySelectorAll("#foryou .card[data-id]")].map(c=>byId(c.dataset.id))); return; }
  const br = e.target.closest("[data-brief]"); if(br && window.BN){ br.dataset.brief==="cust" ? BN.openCustomise() : BN.openSignUp(); return; }
  const go = e.target.closest("[data-go]"); if(go){ selectTab(go.dataset.go); return; }
});
$("mkMini").addEventListener("click", ()=>selectTab("Markets"));
$("logo").addEventListener("click", e=>{ e.preventDefault(); selectTab("All"); scrollTo({top:0, behavior:"smooth"}); });

/* re-render widgets when the language changes */
const baseSetLang = setLang;
setLang = function(l){ baseSetLang(l); setLabels(); renderPray(); renderWx(); if(!$("player").hidden) renderPlayer(); };

/* phones: fold the brand row away while scrolling down */
let lastY = scrollY;
addEventListener("scroll", ()=>{
  const y = scrollY, small = innerWidth <= 760;
  $("rail").classList.toggle("compact", small && y > 160 && y > lastY - 4);
  lastY = y;
}, {passive:true});

setLabels(); renderPray(); renderWx(); loadWx();
setInterval(renderPray, 60000);
setInterval(loadWx, 30*60000);
})();
