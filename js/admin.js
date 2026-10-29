/* BeeNews newsroom: review, edit, approve and correct stories without SQL.
   Access is enforced by the database (row-level security + is_editor()); this page only shows what the database allows. */
(function(){
"use strict";
const {$, esc} = BNP;
const sb = BNP.sb;
const SECTIONS = ["AI","GCC","Health & Wellness","Sports & Events","Politics","Cars"];
const COUNTRIES = ["UAE","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Egypt","Morocco","Philippines","International"];
const LABELS = {official:"Official announcement", corroborated:"Corroborated", developing:"Developing", single:"Single source"};
const SENSITIVE = ["Health & Wellness","Politics"];
const KINDS = {factual:"Factual error", translation:"Translation", link:"Broken link", offensive:"Offensive / unlawful", other:"Other", contact:"Contact message"};
let me = null, tab = "queue", cache = {};

/* ---------- utilities ---------- */
const when = d => d ? new Date(d).toLocaleString("en-GB",{dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Dubai"}) : "";
const pill = (cls, text) => `<span class="pill ${esc(cls)}">${esc(text)}</span>`;
function toast(text, bad){
  const el = $("adToast"); el.innerHTML = `<span class="tick" aria-hidden="true">${bad?"!":"✓"}</span><div><b>${esc(text)}</b></div>`;
  el.hidden = false; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(()=>{ el.hidden = true; }, bad ? 7000 : 3500);
}
const fail = (what, error) => { console.warn("BeeNews admin:", what, error); toast(`${what}: ${error && error.message || error}`, true); };
function slug(s){
  return String(s||"").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48).replace(/-+$/,"");
}
const localInput = d => { const x = new Date(d || Date.now()); const off = 4*60; // Dubai, UTC+4, no DST
  return new Date(x.getTime() + off*60000).toISOString().slice(0,16); };
const fromLocalInput = v => v ? new Date(v + ":00+04:00").toISOString() : new Date().toISOString();

/* ---------- gate: sign in, check editor ---------- */
async function gate(){
  const g = $("adGate");
  if(!sb){ g.innerHTML = `<h2>Newsroom</h2><p>Supabase isn't configured in <code>config.js</code>.</p>`; return; }
  g.hidden = false; g.innerHTML = `<p class="st-note"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Checking your sign-in…</p>`;
  const limit = (pr, ms, what) => Promise.race([pr, new Promise((_,rej)=>setTimeout(()=>rej(new Error(what+" took too long")), ms))]);
  let session = null, data = null, error = null;
  try{ session = (await limit(sb.auth.getSession(), 12000, "Restoring your sign-in")).data.session; }
  catch(e){ return gateError(e); }
  if(!session){ return signInForm(); }
  try{ ({data, error} = await limit(sb.from("editors").select("user_id").eq("user_id", session.user.id).maybeSingle(), 12000, "Checking the editors list")); }
  catch(e){ return gateError(e); }
  if(error && !/0 rows|no rows/i.test(error.message||"")) return gateError(error);
  if(!data){
    g.innerHTML = `<h2>Editors only</h2><p class="st-note">You're signed in as <b>${esc(session.user.email)}</b>, but this account isn't on the editors list.</p>
      <p class="st-note">The owner can add it in Supabase → SQL editor:</p>
      <pre style="white-space:pre-wrap;background:var(--paper);padding:10px;border-radius:10px;font-size:12px">insert into public.editors (user_id)
select id from auth.users where email = '${esc(session.user.email)}';</pre>
      <button type="button" class="btn btn-ghost" id="gOut">Sign out</button>`;
    $("gOut").onclick = async ()=>{ await sb.auth.signOut(); gate(); };
    return;
  }
  me = session.user;
  g.hidden = true; g.style.display = "none"; $("adApp").hidden = false; $("adApp").style.display = "block";
  $("adWho").textContent = me.email;
  $("adOut").onclick = async ()=>{ await sb.auth.signOut(); location.reload(); };
  $("adTabs").onclick = e=>{ const b = e.target.closest("[data-tab]"); if(b){ tab = b.dataset.tab; show(); } };
  $("adNew").onclick = ()=>editStory(null);
  counts(); show();
}
function gateError(e){
  const g = $("adGate"); g.hidden = false;
  g.innerHTML = `<h2 style="margin-top:0">The newsroom couldn't open</h2><p class="msg err">${esc(e && e.message || e)}</p>
    <p class="st-note">Try again in a moment. If this keeps happening, send a screenshot of this box.</p>
    <p><button type="button" class="btn btn-amber" id="gRetry">Try again</button> <button type="button" class="btn btn-ghost" id="gOut2">Sign out</button></p>`;
  $("gRetry").onclick = ()=>location.reload();
  $("gOut2").onclick = async ()=>{ try{ await sb.auth.signOut(); }catch(_){ } location.reload(); };
}
function signInForm(){
  const g = $("adGate");
  g.innerHTML = `<h2 style="margin-top:0">Newsroom sign-in</h2><form class="form" id="gForm">
    <label>Email<input name="email" type="email" autocomplete="email" required></label>
    <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="btn btn-amber" type="submit">Sign in</button>
    <button class="btn btn-ghost" type="button" id="gGoogle"><i class="fa-brands fa-google" aria-hidden="true"></i> Continue with Google</button>
    <div id="gMsg" role="status"></div></form>`;
  $("gGoogle").onclick = ()=>sb.auth.signInWithOAuth({provider:"google", options:{redirectTo:location.href}});
  $("gForm").onsubmit = async e=>{
    e.preventDefault(); const f = e.target;
    const {error} = await sb.auth.signInWithPassword({email:f.email.value, password:f.password.value});
    if(error){ $("gMsg").className = "msg err"; $("gMsg").textContent = error.message; } else gate();
  };
}

/* ---------- counts in the tabs ---------- */
async function counts(){
  const c = async (q) => { const {count} = await q; return count || ""; };
  const [qn, cn, rn] = await Promise.all([
    c(sb.from("stories").select("id",{count:"exact", head:true}).in("status",["in_review","draft"])),
    c(sb.from("story_candidates").select("id",{count:"exact", head:true}).eq("status","new")),
    c(sb.from("error_reports").select("id",{count:"exact", head:true}).eq("status","new"))
  ]);
  $("cntQueue").textContent = qn; $("cntCand").textContent = cn; $("cntRep").textContent = rn;
}

/* ---------- views ---------- */
function show(){
  document.querySelectorAll("#adTabs [data-tab]").forEach(b=>b.setAttribute("aria-selected", b.dataset.tab===tab));
  $("adView").innerHTML = `<p class="ad-empty">Loading…</p>`;
  ({queue:viewQueue, candidates:viewCandidates, stories:viewStories, reports:viewReports, sources:viewSources, health:viewHealth}[tab])()
    .catch(e=>fail("Couldn't load this view", e));
}
function storyRow(s, extra){
  const sens = s.sensitive ? pill("sens", s.editor_approved ? "Sensitive · approved" : "Sensitive · needs approval") : "";
  return `<div class="ad-row" data-id="${esc(s.id)}"><div><h3>${s.breaking?"🔴 ":""}${esc(s.headline)}</h3>
    <div class="meta">${pill(s.status, s.status.replace("_"," "))}${sens}<span>${esc(s.section)} · ${esc(s.country)}</span><span>${esc(LABELS[s.label])}</span><span>${esc(s.publisher)}</span><span>${esc(when(s.published_at))}</span>${s.brief?"":"<span>· no brief yet</span>"}</div></div>
    <div class="acts">${extra||""}<button type="button" class="btn btn-ghost" data-edit="${esc(s.id)}"><i class="fa-solid fa-pen" aria-hidden="true"></i> Edit</button>
    ${s.status==="published"?`<a class="btn btn-ghost" href="/story/${encodeURIComponent(s.id)}" target="_blank" rel="noopener"><i class="fa-solid fa-eye" aria-hidden="true"></i></a>`:""}</div></div>`;
}
function wireRows(){
  $("adView").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editStory(b.dataset.edit));
  $("adView").querySelectorAll("[data-publish]").forEach(b=>b.onclick=()=>quickPublish(b.dataset.publish));
}
async function viewQueue(){
  const {data, error} = await sb.from("stories").select("*").in("status",["in_review","draft"]).order("updated_at",{ascending:false}).limit(200);
  if(error) throw error;
  $("adView").innerHTML = `<p class="st-note">Stories waiting for a decision. Health and politics stories need your approval before they can go live.</p>
    <div class="ad-list">${data.length ? data.map(s=>storyRow(s, s.status==="in_review" ? `<button type="button" class="btn btn-amber" data-publish="${esc(s.id)}"><i class="fa-solid fa-check" aria-hidden="true"></i> ${s.sensitive?"Approve &amp; publish":"Publish"}</button>` : "")).join("") : `<p class="ad-empty">Nothing waiting. 🎉</p>`}</div>`;
  cache.stories = data; wireRows();
}
async function viewStories(){
  $("adView").innerHTML = `<div class="ad-bar"><input type="search" id="fQ" placeholder="Search headlines…">
    <select id="fSt"><option value="">Any status</option><option>published</option><option>in_review</option><option>draft</option><option>retracted</option></select>
    <select id="fSec"><option value="">Any section</option>${SECTIONS.map(s=>`<option>${esc(s)}</option>`).join("")}</select></div><div class="ad-list" id="fList"></div>`;
  const run = async ()=>{
    let q = sb.from("stories").select("*").order("published_at",{ascending:false}).limit(100);
    const term = $("fQ").value.trim(); if(term) q = q.ilike("headline", `%${term.replace(/[%_]/g,"")}%`);
    if($("fSt").value) q = q.eq("status", $("fSt").value);
    if($("fSec").value) q = q.eq("section", $("fSec").value);
    const {data, error} = await q; if(error) return fail("Search failed", error);
    cache.stories = data;
    $("fList").innerHTML = data.length ? data.map(s=>storyRow(s)).join("") : `<p class="ad-empty">No stories match.</p>`;
    wireRows();
  };
  let tmr; $("fQ").oninput = ()=>{ clearTimeout(tmr); tmr = setTimeout(run, 250); };
  $("fSt").onchange = $("fSec").onchange = run; run();
}
async function viewCandidates(){
  const {data, error} = await sb.from("story_candidates").select("*, sources(name,kind,default_section,default_country,permission)").eq("status","new").order("published_at",{ascending:false, nullsFirst:false}).limit(150);
  if(error) throw error;
  $("adView").innerHTML = `<p class="st-note">Headlines collected from your approved sources' feeds. Turn one into a draft to write the BeeNews summary and brief in your own words, or dismiss it. Feed text below is for reference only and is never published.</p>
    <div class="ad-list">${data.length ? data.map(c=>`<div class="ad-row"><div><h3>${esc(c.title)}</h3>
      <div class="meta"><span>${esc(c.sources ? c.sources.name : "Unknown source")}</span><span>${esc(when(c.published_at || c.fetched_at))}</span><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></div>
      ${c.excerpt?`<p class="ex">${esc(c.excerpt.slice(0,280))}${c.excerpt.length>280?"…":""}</p>`:""}</div>
      <div class="acts"><button type="button" class="btn btn-amber" data-draft="${c.id}"><i class="fa-solid fa-file-pen" aria-hidden="true"></i> Draft story</button><button type="button" class="btn btn-ghost" data-dismiss="${c.id}">Dismiss</button></div></div>`).join("")
      : `<p class="ad-empty">No new headlines. The daily collector adds them here once it's switched on (see LAUNCH.md).</p>`}</div>`;
  cache.cands = data;
  $("adView").querySelectorAll("[data-dismiss]").forEach(b=>b.onclick=async ()=>{
    const {error} = await sb.from("story_candidates").update({status:"dismissed"}).eq("id", b.dataset.dismiss);
    if(error) return fail("Couldn't dismiss", error); b.closest(".ad-row").remove(); counts();
  });
  $("adView").querySelectorAll("[data-draft]").forEach(b=>b.onclick=()=>{
    const c = cache.cands.find(x=>String(x.id)===b.dataset.draft); const src = c.sources || {};
    editStory(null, {headline:c.title, url:c.url, publisher:src.name||"", published_at:c.published_at||new Date().toISOString(),
      section: SECTIONS.includes(src.default_section) ? src.default_section : "GCC", country: src.default_country || "UAE",
      label: src.kind==="official" ? "official" : "single", source_candidate:c.id, _excerpt:c.excerpt});
  });
}
async function viewReports(){
  const {data, error} = await sb.from("error_reports").select("*").in("status",["new","reviewing"]).order("created_at",{ascending:false}).limit(200);
  if(error) throw error;
  $("adView").innerHTML = `<p class="st-note">Reader reports and contact messages. Aim to respond within 2 working days. If a report is right, fix the story and log a correction; the reader-facing corrections page updates automatically.</p>
    <div class="ad-list">${data.length ? data.map(r=>`<div class="ad-row"><div><h3>${esc(KINDS[r.kind]||r.kind)}${r.story_id?` · <a href="/story/${encodeURIComponent(r.story_id)}" target="_blank" rel="noopener">${esc(r.story_id)}</a>`:""}</h3>
      <div class="meta">${pill(r.status, r.status)}<span>${esc(when(r.created_at))}</span>${r.contact_email?`<a href="mailto:${esc(r.contact_email)}">${esc(r.contact_email)}</a>`:"<span>no email</span>"}</div>
      <p class="ex" style="white-space:pre-wrap">${esc(r.message)}</p></div>
      <div class="acts">${r.story_id?`<button type="button" class="btn btn-amber" data-fix="${r.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i> Fix story</button>`:""}
        <button type="button" class="btn btn-ghost" data-rs="${r.id}" data-to="reviewing">Reviewing</button>
        <button type="button" class="btn btn-ghost" data-rs="${r.id}" data-to="rejected">No change needed</button>
        <button type="button" class="btn btn-ghost" data-rs="${r.id}" data-to="corrected">Done</button></div></div>`).join("")
      : `<p class="ad-empty">No open reports.</p>`}</div>`;
  cache.reports = data;
  $("adView").querySelectorAll("[data-rs]").forEach(b=>b.onclick=()=>setReport(b.dataset.rs, b.dataset.to));
  $("adView").querySelectorAll("[data-fix]").forEach(b=>b.onclick=()=>{ const r = cache.reports.find(x=>String(x.id)===b.dataset.fix); editStory(r.story_id, null, r); });
}
async function setReport(id, status, note){
  const {error} = await sb.from("error_reports").update({status, handled_by:me.id, handled_at:new Date().toISOString(), editor_note:note||null}).eq("id", id);
  if(error) return fail("Couldn't update the report", error);
  toast("Report updated"); counts(); if(tab==="reports") show();
}
async function viewSources(){
  const {data, error} = await sb.from("sources").select("*").order("name");
  if(error) throw error;
  $("adView").innerHTML = `<p class="st-note">Only stories from these sources enter the queue. "Permission" records what each publisher allows: link-only (headline in our own words + link), headline-summary, or full text under licence.</p>
    <div class="ad-bar"><button type="button" class="btn btn-amber" id="srcNew"><i class="fa-solid fa-plus" aria-hidden="true"></i> Add source</button></div>
    <table class="ad-table"><thead><tr><th>Source</th><th>Type</th><th>Feed</th><th>Default</th><th>Permission</th><th>Active</th><th></th></tr></thead><tbody>
    ${data.map(s=>`<tr><td><a href="${esc(s.homepage)}" target="_blank" rel="noopener">${esc(s.name)}</a></td><td>${esc(s.kind)}</td><td class="mono">${esc(s.feed_url||"—")}</td>
      <td>${esc([s.default_section, s.default_country].filter(Boolean).join(" · ")||"—")}</td><td>${esc(s.permission)}</td><td>${s.active?"Yes":"No"}</td>
      <td><button type="button" class="btn btn-ghost" data-src="${s.id}">Edit</button></td></tr>`).join("")}</tbody></table>`;
  cache.sources = data;
  $("srcNew").onclick = ()=>editSource(null);
  $("adView").querySelectorAll("[data-src]").forEach(b=>b.onclick=()=>editSource(cache.sources.find(x=>String(x.id)===b.dataset.src)));
}
function editSource(s){
  s = s || {kind:"newsroom", permission:"link-only", active:true};
  const dlg = $("adDlg");
  const opt = (arr, v) => arr.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("");
  dlg.innerHTML = `<form class="dbody wide"><div class="dhead"><h2>${s.id?"Edit source":"Add source"}</h2><button type="button" class="x" aria-label="Close">×</button></div>
    <div class="ad-form">
      <label class="half">Name<input name="name" required value="${esc(s.name||"")}"></label>
      <label class="half">Homepage<input name="homepage" type="url" required value="${esc(s.homepage||"")}"></label>
      <label class="full">RSS / Atom feed URL<input name="feed_url" type="url" value="${esc(s.feed_url||"")}"><span class="hint">Leave empty if the source has no feed.</span></label>
      <label>Type<select name="kind">${opt(["official","agency","newsroom","science","secondary"], s.kind)}</select></label>
      <label>Default section<select name="default_section"><option value=""></option>${opt(SECTIONS, s.default_section)}</select></label>
      <label>Default country<select name="default_country"><option value=""></option>${opt(COUNTRIES, s.default_country)}</select></label>
      <label>Permission<select name="permission">${opt(["link-only","headline-summary","full-text-licensed"], s.permission)}</select></label>
      <label class="full">Permission note<input name="permission_note" value="${esc(s.permission_note||"")}" placeholder="e.g. licence agreement ref, contact, expiry"></label>
      <label class="chk full"><input type="checkbox" name="active"${s.active?" checked":""}> Active (collect from this source)</label>
      <div class="ad-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-amber" type="submit">Save</button></div></div></form>`;
  dlg.querySelector(".x").onclick = dlg.querySelector("[data-close]").onclick = ()=>dlg.close();
  dlg.querySelector("form").onsubmit = async e=>{
    e.preventDefault(); const f = e.target;
    const row = {name:f.name.value.trim(), homepage:f.homepage.value.trim(), feed_url:f.feed_url.value.trim()||null, kind:f.kind.value,
      default_section:f.default_section.value||null, default_country:f.default_country.value||null, permission:f.permission.value,
      permission_note:f.permission_note.value.trim()||null, active:f.active.checked};
    const {error} = s.id ? await sb.from("sources").update(row).eq("id", s.id) : await sb.from("sources").insert(row);
    if(error) return fail("Couldn't save the source", error);
    dlg.close(); toast("Source saved"); show();
  };
  dlg.showModal();
}
async function viewHealth(){
  const since = new Date(Date.now() - 13*864e5).toISOString().slice(0,10);
  const [m, e] = await Promise.all([
    sb.from("metrics_daily").select("*").gte("day", since).order("day",{ascending:false}),
    sb.from("client_errors").select("*").order("at",{ascending:false}).limit(50)
  ]);
  if(m.error) throw m.error;
  const tot = {}; (m.data||[]).forEach(r=>{ tot[r.event] = (tot[r.event]||0) + Number(r.count); });
  const top = {}; (m.data||[]).filter(r=>r.event==="story_open" && r.key).forEach(r=>{ top[r.key] = (top[r.key]||0) + Number(r.count); });
  const topList = Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const names = {page_view:"Page views", story_open:"Story pages opened", listen:"Stories listened to", save:"Saves", share:"Shares", search:"Searches", signup:"Sign-ups", report_error:"Error reports", install:"App installs", section_open:"Section opens"};
  $("adView").innerHTML = `<p class="st-note">Last 14 days. Counts are daily totals only: no account IDs, no IP addresses, no cookies.</p>
    <div class="ad-stats">${Object.keys(names).map(k=>`<div class="ad-stat"><b>${(tot[k]||0).toLocaleString("en")}</b><span>${names[k]}</span></div>`).join("")}</div>
    <h2 style="font:800 17px var(--f-ui)">Most-opened stories</h2>
    ${topList.length?`<table class="ad-table"><tbody>${topList.map(([k,v])=>`<tr><td><a href="/story/${encodeURIComponent(k)}" target="_blank" rel="noopener">${esc(k)}</a></td><td>${v}</td></tr>`).join("")}</tbody></table>`:`<p class="ad-empty">No data yet.</p>`}
    <h2 style="font:800 17px var(--f-ui);margin-top:22px">Recent app errors</h2>
    ${e.error?`<p class="ad-empty">Error log not available (${esc(e.error.message)}).</p>`: (e.data.length?`<table class="ad-table"><thead><tr><th>When</th><th>Message</th><th>Where</th><th>Browser</th></tr></thead><tbody>${e.data.map(x=>`<tr><td>${esc(when(x.at))}</td><td class="mono">${esc(x.message)}</td><td class="mono">${esc(x.page)} ${esc(x.source||"")}</td><td class="mono">${esc((x.agent||"").slice(0,60))}</td></tr>`).join("")}</tbody></table>`:`<p class="ad-empty">No errors reported. 👍</p>`)}`;
}

/* ---------- story editor ---------- */
async function editStory(id, preset, report){
  let s = null, corr = [], log = [];
  if(id){
    const [a, b, c] = await Promise.all([
      sb.from("stories").select("*").eq("id", id).maybeSingle(),
      sb.from("story_corrections").select("*").eq("story_id", id).order("corrected_at",{ascending:false}),
      sb.from("story_events").select("*").eq("story_id", id).order("at",{ascending:false}).limit(12)
    ]);
    if(a.error || !a.data) return fail("Couldn't open the story", a.error || "not found");
    s = a.data; corr = b.data || []; log = c.data || [];
  } else {
    s = Object.assign({status:"draft", section:"GCC", country:"UAE", label:"single", published_at:new Date().toISOString(), translations:{}, brief_translations:{}}, preset||{});
  }
  const tr = s.translations || {}, btr = s.brief_translations || {};
  const opt = (arr, v, names) => arr.map(x=>`<option value="${esc(x)}"${x===v?" selected":""}>${esc(names?names[x]:x)}</option>`).join("");
  const dlg = $("adDlg");
  const tf = (l) => `<fieldset><legend>${{ar:"Arabic",fr:"French",de:"German"}[l]}</legend>
      <label>Headline<input name="h_${l}" ${l==="ar"?'dir="rtl" lang="ar"':""} value="${esc((tr[l]||[])[0]||"")}"></label>
      <label>Summary<textarea name="s_${l}" ${l==="ar"?'dir="rtl" lang="ar"':""}>${esc((tr[l]||[])[1]||"")}</textarea></label>
      <label class="full" style="grid-column:1/-1">Brief<textarea name="b_${l}" ${l==="ar"?'dir="rtl" lang="ar"':""}>${esc(btr[l]||"")}</textarea></label></fieldset>`;
  dlg.innerHTML = `<form class="dbody wide" novalidate><div class="dhead"><h2>${id?"Edit story":"New story"} ${id?pill(s.status, s.status.replace("_"," ")):""}</h2><button type="button" class="x" aria-label="Close">×</button></div>
    <p class="dmsg" hidden role="status"></p>
    <div class="ad-form">
      ${report?`<div class="ad-warn"><b>Reader report:</b> ${esc(report.message)}</div>`:""}
      ${s._excerpt?`<div class="ad-warn"><b>Feed text (reference only, do not copy):</b> ${esc(s._excerpt.slice(0,400))}</div>`:""}
      <label class="full">Headline (our own words)<input name="headline" required maxlength="160" value="${esc(s.headline||"")}"></label>
      <label class="full">Summary (one or two sentences, shown on cards)<textarea name="summary" required maxlength="420">${esc(s.summary||"")}</textarea></label>
      <label class="full">BeeNews brief (longer, original, shown on the story page and read aloud)<textarea class="tall" name="brief" maxlength="2500">${esc(s.brief||"")}</textarea>
        <span class="hint">Write it from the source in your own words. Do not paste the publisher's article. Blank lines start new paragraphs.</span></label>
      <label>Section<select name="section">${opt(SECTIONS, s.section)}</select></label>
      <label>Country<select name="country">${opt(COUNTRIES, s.country)}</select></label>
      <label>Verification label<select name="label">${opt(Object.keys(LABELS), s.label, LABELS)}</select></label>
      <label>Published (Dubai time)<input name="published_at" type="datetime-local" value="${esc(localInput(s.published_at))}"></label>
      <label class="half">Publisher<input name="publisher" required value="${esc(s.publisher||"")}"></label>
      <label class="half">Original report URL<input name="url" type="url" required value="${esc(s.url||"")}"></label>
      <label class="full">Also reported by<input name="also_reported" value="${esc(s.also_reported||"")}" placeholder="e.g. Gulf News, The National"></label>
      <label class="chk"><input type="checkbox" name="date_only"${s.date_only?" checked":""}> Date only (no time)</label>
      <label class="chk"><input type="checkbox" name="link_is_section"${s.link_is_section?" checked":""}> Link opens a section page</label>
      <label class="chk"><input type="checkbox" name="is_lead"${s.is_lead?" checked":""}> Top story</label>
      <label class="chk"><input type="checkbox" name="breaking"${s.breaking?" checked":""}> Breaking (sends alerts)</label>
      <label class="chk"><input type="checkbox" name="sensitive"${s.sensitive?" checked":""}> Sensitive (health or politics)</label>
      <label class="chk"><input type="checkbox" name="editor_approved"${s.editor_approved?" checked":""}> I approve this story</label>
      <div class="ad-warn" id="sensWarn" hidden>Health and politics stories must be approved by an editor before publishing.</div>
      <div class="full" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b style="font:800 14px var(--f-ui)">Translations</b>
        <button type="button" class="btn btn-ghost" id="aiTr"><i class="fa-solid fa-language" aria-hidden="true"></i> Draft translations with AI</button>
        <span class="hint">AI drafts must be read and fixed by a speaker of each language before publishing.</span></div>
      ${tf("ar")}${tf("fr")}${tf("de")}
      ${s.status==="published"?`<fieldset><legend>Correction</legend><label class="chk" style="grid-column:1/-1"><input type="checkbox" name="is_corr"${report?" checked":""}> This change corrects a mistake readers saw</label>
        <label style="grid-column:1/-1">Correction note (public)<textarea name="corr_note" placeholder="e.g. An earlier version said the event starts on 3 November. It starts on 5 November.">${report?"":""}</textarea></label></fieldset>`:""}
      ${corr.length?`<div class="ad-log"><b>Corrections:</b> ${corr.map(c=>`${esc(when(c.corrected_at))}: ${esc(c.note)}`).join(" · ")}</div>`:""}
      ${log.length?`<div class="ad-log"><b>History:</b> ${log.map(l=>`${esc(when(l.at))} ${esc(l.action)}${l.detail&&l.detail.to?` → ${esc(l.detail.to)}`:""}`).join(" · ")}</div>`:""}
      <div class="ad-actions"><div class="left">${s.status==="published"?`<button type="button" class="btn btn-ghost" data-act="retracted">Retract</button>`:""}
        <button type="button" class="btn btn-ghost" data-close>Cancel</button></div>
        <button type="button" class="btn btn-ghost" data-act="draft">Save draft</button>
        <button type="button" class="btn btn-dark" data-act="in_review">Send to review</button>
        <button type="button" class="btn btn-amber" data-act="published"><i class="fa-solid fa-check" aria-hidden="true"></i> ${s.status==="published"?"Update live story":"Publish"}</button></div>
    </div></form>`;
  const form = dlg.querySelector("form"), F = form.elements;
  const dmsg = (t, kind)=>{ const m = dlg.querySelector(".dmsg"); m.textContent = t; m.dataset.kind = kind||"error"; m.hidden = !t; if(t) m.scrollIntoView({block:"nearest"}); };
  const syncSens = ()=>{ if(SENSITIVE.includes(F.section.value)) F.sensitive.checked = true; $("sensWarn").hidden = !(F.sensitive.checked && !F.editor_approved.checked); };
  F.section.onchange = F.sensitive.onchange = F.editor_approved.onchange = syncSens; syncSens();
  dlg.querySelector(".x").onclick = dlg.querySelector("[data-close]").onclick = ()=>dlg.close();
  $("aiTr").onclick = async ()=>{
    if(!F.headline.value.trim() || !F.summary.value.trim()) return dmsg("Write the English headline and summary first.");
    $("aiTr").disabled = true; $("aiTr").innerHTML = "Translating…";
    try{
      const {data, error} = await sb.functions.invoke("editor-ai", {body:{task:"translate", headline:F.headline.value, summary:F.summary.value, brief:F.brief.value}});
      if(error) throw error;
      for(const l of ["ar","fr","de"]) if(data[l]){ F["h_"+l].value = data[l].headline||""; F["s_"+l].value = data[l].summary||""; F["b_"+l].value = data[l].brief||""; }
      dmsg("Draft translations added. Please check each one before publishing.","ok");
    }catch(e){ dmsg("The AI helper isn't available yet (deploy the editor-ai function, see LAUNCH.md). You can still type translations."); }
    finally{ $("aiTr").disabled = false; $("aiTr").innerHTML = `<i class="fa-solid fa-language" aria-hidden="true"></i> Draft translations with AI`; }
  };
  dlg.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>save(b.dataset.act));
  async function save(status){
    dmsg("");
    const need = ["headline","summary","publisher","url"].filter(k=>!F[k].value.trim());
    if(need.length && status!=="draft") return dmsg("Please fill in: " + need.join(", ") + ".");
    if(F.url.value && !/^https?:\/\//.test(F.url.value.trim())) return dmsg("The original URL must start with http:// or https://");
    if(status==="published" && F.sensitive.checked && !F.editor_approved.checked) return dmsg("Tick “I approve this story” to publish a health or politics story.");
    if(status==="published" && F.is_corr && F.is_corr.checked && !F.corr_note.value.trim()) return dmsg("Add a public correction note.");
    if(status==="retracted" && !confirm("Retract this story? It disappears from the app and its page shows 'not found'. Log a correction note first if readers relied on it.")) return;
    const translations = {}, brief_translations = {};
    for(const l of ["ar","fr","de"]){
      const h = F["h_"+l].value.trim(), su = F["s_"+l].value.trim(), br = F["b_"+l].value.trim();
      if(h || su) translations[l] = [h || F.headline.value.trim(), su || F.summary.value.trim()];
      if(br) brief_translations[l] = br;
    }
    const row = {headline:F.headline.value.trim(), summary:F.summary.value.trim(), brief:F.brief.value.trim()||null,
      section:F.section.value, country:F.country.value, label:F.label.value, published_at:fromLocalInput(F.published_at.value),
      publisher:F.publisher.value.trim() || "—", url:F.url.value.trim() || "https://", also_reported:F.also_reported.value.trim()||null,
      date_only:F.date_only.checked, link_is_section:F.link_is_section.checked, is_lead:F.is_lead.checked, breaking:F.breaking.checked,
      sensitive:F.sensitive.checked, editor_approved:F.editor_approved.checked, translations, brief_translations, status};
    if(s.source_candidate) row.source_candidate = s.source_candidate;
    const btns = dlg.querySelectorAll("button"); btns.forEach(x=>x.disabled = true);
    try{
      let sid = id;
      if(id){
        const {error} = await sb.from("stories").update(row).eq("id", id); if(error) throw error;
      } else {
        sid = (new Date(row.published_at).toISOString().slice(0,10).replace(/-/g,"")) + "-" + (slug(row.headline) || "story");
        const {error} = await sb.from("stories").insert(Object.assign({id:sid}, row));
        if(error && /duplicate|unique/i.test(error.message)){
          sid += "-" + Math.random().toString(36).slice(2,6);
          const r2 = await sb.from("stories").insert(Object.assign({id:sid}, row)); if(r2.error) throw r2.error;
        } else if(error) throw error;
        if(s.source_candidate) await sb.from("story_candidates").update({status:"drafted", story_id:sid}).eq("id", s.source_candidate);
      }
      if(F.is_corr && F.is_corr.checked && F.corr_note.value.trim()){
        const {error} = await sb.from("story_corrections").insert({story_id:sid, note:F.corr_note.value.trim(), corrected_by:me.id});
        if(error) throw error;
      }
      if(report) await setReport(report.id, "corrected", F.corr_note ? F.corr_note.value.trim() : null);
      if(status==="published" && row.breaking && !s.breaking){
        sb.functions.invoke("notify", {body:{story_id:sid}}).then(r=>{ if(r.error) console.warn("notify:", r.error); });
      }
      dlg.close();
      toast({draft:"Draft saved", in_review:"Sent to review", published:"Published", retracted:"Story retracted"}[status]);
      counts(); show();
    }catch(e){
      const m = String(e.message||e);
      dmsg(/sensitive_needs_approval/.test(m) ? "The database refused: health and politics stories need editor approval before publishing." : m);
    }finally{ btns.forEach(x=>x.disabled = false); }
  }
  if(!dlg.open) dlg.showModal();
  F.headline.focus();
}
async function quickPublish(id){
  const s = (cache.stories||[]).find(x=>x.id===id); if(!s) return;
  if(s.sensitive && !confirm("Approve and publish this health/politics story? You confirm you've checked it against the source.")) return;
  const {error} = await sb.from("stories").update({status:"published", editor_approved: s.sensitive ? true : s.editor_approved}).eq("id", id);
  if(error) return fail("Couldn't publish", error);
  toast("Published"); counts(); show();
}

window.addEventListener("error", e=>{ if(!me) gateError(e.message); });
BNP.render();
gate().catch(e=>{ console.error("BeeNews admin:", e); gateError(e); });
})();
