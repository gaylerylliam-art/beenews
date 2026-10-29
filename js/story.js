/* BeeNews story page: /story/<id>. Loads one published story from Supabase and shows the BeeNews brief,
   the source, the verification label, corrections, Listen, Save, Share, Report an error and related stories. */
(function(){
"use strict";
const {$, esc} = BNP;
const t = k => BNP.t(k);
BNP.addStrings({
 en:{stLoading:"Loading story…",stMissing:"We couldn't find this story. It may have been removed or the link is incomplete.",stOffline:"This story couldn't be loaded right now. Check your connection and try again.",
  stHome:"Go to the homepage",listen:"Listen",stop:"Stop",save:"Save",saved:"Saved",share:"Share",copy:"Copy link",copied:"Link copied",
  readOrig:"Read the original report",source:"Source",also:"Also reported by",published:"Published",updated:"Updated",
  briefH:"The BeeNews brief",briefNote:"Written by BeeNews from the source report. Read the original for the full story.",
  verifyH:"How we checked this",corrH:"Corrections",corrNone:"No corrections to this story.",
  reportH:"Spot an error?",reportP:"Tell our editors. We review every report.",report:"Report an error",
  rKind:"What's wrong?",rFact:"A fact is wrong",rTrans:"The translation is wrong",rLink:"The link doesn't work",rOff:"Offensive or unlawful",rOther:"Something else",
  rMsg:"Details",rEmail:"Email (optional, for a reply)",rSend:"Send report",rThanks:"Thank you. An editor will review your report.",rShort:"Please add a few words.",rFail:"Sorry, the report couldn't be sent. Please try again.",
  related:"More in this section",aiNote:"Translated with AI help and reviewed by our editors.",breaking:"Breaking",noVoice:"Read-aloud isn't available in this browser.",
  sec_ai:"AI",sec_gcc:"GCC",sec_health:"Health & Wellness",sec_sports:"Sports & Events",sec_politics:"Politics",sec_cars:"Cars",
  lab_official:"Official announcement",lab_corroborated:"Corroborated",lab_developing:"Developing",lab_single:"Single source",
  labd_official:"Comes directly from a government, regulator, health authority or the organisation itself.",
  labd_corroborated:"Confirmed by at least two independent approved sources, or by the primary document.",
  labd_developing:"The situation is still changing; details may be updated.",
  labd_single:"Reported by one source so far. Treat as unconfirmed.",
  "c:UAE":"UAE","c:Saudi Arabia":"Saudi Arabia","c:Qatar":"Qatar","c:Kuwait":"Kuwait","c:Bahrain":"Bahrain","c:Oman":"Oman","c:Morocco":"Morocco","c:Philippines":"Philippines","c:Egypt":"Egypt","c:International":"International"},
 ar:{stLoading:"جارٍ تحميل الخبر…",stMissing:"لم نعثر على هذا الخبر. ربما حُذف أو أن الرابط غير مكتمل.",stOffline:"تعذّر تحميل الخبر الآن. تحقق من الاتصال وحاول مجدداً.",
  stHome:"الذهاب إلى الصفحة الرئيسية",listen:"استمع",stop:"إيقاف",save:"حفظ",saved:"محفوظ",share:"مشاركة",copy:"نسخ الرابط",copied:"تم نسخ الرابط",
  readOrig:"اقرأ التقرير الأصلي",source:"المصدر",also:"نقله أيضاً",published:"نُشر",updated:"حُدّث",
  briefH:"موجز بي نيوز",briefNote:"كتبه فريق بي نيوز استناداً إلى تقرير المصدر. اقرأ الأصل للاطلاع على القصة كاملة.",
  verifyH:"كيف تحققنا من الخبر",corrH:"التصحيحات",corrNone:"لا توجد تصحيحات لهذا الخبر.",
  reportH:"هل لاحظت خطأ؟",reportP:"أبلغ محررينا، فنحن نراجع كل بلاغ.",report:"الإبلاغ عن خطأ",
  rKind:"ما المشكلة؟",rFact:"معلومة خاطئة",rTrans:"الترجمة خاطئة",rLink:"الرابط لا يعمل",rOff:"محتوى مسيء أو مخالف",rOther:"أمر آخر",
  rMsg:"التفاصيل",rEmail:"البريد الإلكتروني (اختياري للرد)",rSend:"إرسال البلاغ",rThanks:"شكراً لك. سيراجع أحد المحررين بلاغك.",rShort:"يرجى إضافة بضع كلمات.",rFail:"عذراً، تعذّر إرسال البلاغ. حاول مجدداً.",
  related:"المزيد في هذا القسم",aiNote:"تُرجم بمساعدة الذكاء الاصطناعي وراجعه محررونا.",breaking:"عاجل",noVoice:"القراءة الصوتية غير متاحة في هذا المتصفح.",
  sec_ai:"الذكاء الاصطناعي",sec_gcc:"الخليج",sec_health:"الصحة والعافية",sec_sports:"الرياضة والفعاليات",sec_politics:"السياسة",sec_cars:"السيارات",
  lab_official:"إعلان رسمي",lab_corroborated:"مؤكَّد",lab_developing:"قيد التطور",lab_single:"مصدر واحد",
  labd_official:"صادر مباشرة عن جهة حكومية أو تنظيمية أو صحية أو عن الجهة المعنية.",
  labd_corroborated:"أكّده مصدران معتمدان مستقلان على الأقل، أو الوثيقة الأصلية.",
  labd_developing:"الوضع ما زال يتغير وقد تُحدَّث التفاصيل.",
  labd_single:"نقله مصدر واحد حتى الآن، ويُعامل على أنه غير مؤكَّد.",
  "c:UAE":"الإمارات","c:Saudi Arabia":"السعودية","c:Qatar":"قطر","c:Kuwait":"الكويت","c:Bahrain":"البحرين","c:Oman":"عُمان","c:Morocco":"المغرب","c:Philippines":"الفلبين","c:Egypt":"مصر","c:International":"دولي"},
 fr:{stLoading:"Chargement…",stMissing:"Article introuvable. Il a peut-être été retiré ou le lien est incomplet.",stOffline:"Impossible de charger l'article. Vérifiez votre connexion.",
  stHome:"Aller à l'accueil",listen:"Écouter",stop:"Arrêter",save:"Enregistrer",saved:"Enregistré",share:"Partager",copy:"Copier le lien",copied:"Lien copié",
  readOrig:"Lire l'article original",source:"Source",also:"Également rapporté par",published:"Publié",updated:"Mis à jour",
  briefH:"Le résumé BeeNews",briefNote:"Rédigé par BeeNews d'après l'article source. Lisez l'original pour tous les détails.",
  verifyH:"Comment nous avons vérifié",corrH:"Corrections",corrNone:"Aucune correction pour cet article.",
  reportH:"Une erreur ?",reportP:"Prévenez nos éditeurs. Chaque signalement est examiné.",report:"Signaler une erreur",
  rKind:"Quel est le problème ?",rFact:"Un fait est erroné",rTrans:"La traduction est erronée",rLink:"Le lien ne fonctionne pas",rOff:"Offensant ou illégal",rOther:"Autre",
  rMsg:"Détails",rEmail:"E-mail (facultatif)",rSend:"Envoyer",rThanks:"Merci. Un éditeur examinera votre signalement.",rShort:"Ajoutez quelques mots.",rFail:"Échec de l'envoi. Réessayez.",
  related:"Plus dans cette rubrique",aiNote:"Traduit avec l'aide de l'IA et relu par nos éditeurs.",breaking:"Urgent",noVoice:"La lecture vocale n'est pas disponible dans ce navigateur.",
  sec_ai:"IA",sec_gcc:"Golfe (CCG)",sec_health:"Santé & bien-être",sec_sports:"Sports & événements",sec_politics:"Politique",sec_cars:"Automobile",
  lab_official:"Annonce officielle",lab_corroborated:"Confirmé",lab_developing:"En développement",lab_single:"Source unique",
  labd_official:"Provient directement d'un gouvernement, d'un régulateur, d'une autorité sanitaire ou de l'organisation elle-même.",
  labd_corroborated:"Confirmé par au moins deux sources indépendantes approuvées, ou par le document original.",
  labd_developing:"La situation évolue ; les détails peuvent changer.",labd_single:"Une seule source pour l'instant. À considérer comme non confirmé.",
  "c:UAE":"EAU","c:Saudi Arabia":"Arabie saoudite","c:Qatar":"Qatar","c:Kuwait":"Koweït","c:Bahrain":"Bahreïn","c:Oman":"Oman","c:Morocco":"Maroc","c:Philippines":"Philippines","c:Egypt":"Égypte","c:International":"International"},
 de:{stLoading:"Wird geladen…",stMissing:"Diese Meldung wurde nicht gefunden. Sie wurde entfernt oder der Link ist unvollständig.",stOffline:"Die Meldung konnte nicht geladen werden. Bitte Verbindung prüfen.",
  stHome:"Zur Startseite",listen:"Anhören",stop:"Stopp",save:"Merken",saved:"Gemerkt",share:"Teilen",copy:"Link kopieren",copied:"Link kopiert",
  readOrig:"Originalbericht lesen",source:"Quelle",also:"Auch berichtet von",published:"Veröffentlicht",updated:"Aktualisiert",
  briefH:"Das BeeNews-Briefing",briefNote:"Von BeeNews auf Basis des Quellberichts verfasst. Den vollständigen Bericht finden Sie im Original.",
  verifyH:"So haben wir geprüft",corrH:"Korrekturen",corrNone:"Keine Korrekturen zu dieser Meldung.",
  reportH:"Fehler entdeckt?",reportP:"Sagen Sie es unserer Redaktion. Wir prüfen jede Meldung.",report:"Fehler melden",
  rKind:"Was ist falsch?",rFact:"Eine Angabe ist falsch",rTrans:"Die Übersetzung ist falsch",rLink:"Der Link funktioniert nicht",rOff:"Anstößig oder rechtswidrig",rOther:"Etwas anderes",
  rMsg:"Details",rEmail:"E-Mail (optional)",rSend:"Senden",rThanks:"Danke. Die Redaktion prüft Ihre Meldung.",rShort:"Bitte ein paar Worte ergänzen.",rFail:"Senden fehlgeschlagen. Bitte erneut versuchen.",
  related:"Mehr aus dieser Rubrik",aiNote:"Mit KI-Hilfe übersetzt und von der Redaktion geprüft.",breaking:"Eilmeldung",noVoice:"Vorlesen ist in diesem Browser nicht verfügbar.",
  sec_ai:"KI",sec_gcc:"Golfstaaten",sec_health:"Gesundheit",sec_sports:"Sport & Events",sec_politics:"Politik",sec_cars:"Autos",
  lab_official:"Offizielle Mitteilung",lab_corroborated:"Bestätigt",lab_developing:"In Entwicklung",lab_single:"Einzelquelle",
  labd_official:"Stammt direkt von einer Regierung, Behörde, Gesundheitsbehörde oder der Organisation selbst.",
  labd_corroborated:"Von mindestens zwei unabhängigen geprüften Quellen oder dem Originaldokument bestätigt.",
  labd_developing:"Die Lage ändert sich noch; Details können sich ändern.",labd_single:"Bisher nur aus einer Quelle. Als unbestätigt behandeln.",
  "c:UAE":"VAE","c:Saudi Arabia":"Saudi-Arabien","c:Qatar":"Katar","c:Kuwait":"Kuwait","c:Bahrain":"Bahrain","c:Oman":"Oman","c:Morocco":"Marokko","c:Philippines":"Philippinen","c:Egypt":"Ägypten","c:International":"International"}
});
const SEC = {"AI":["ai","fa-microchip"],"GCC":["gcc","fa-earth-asia"],"Health & Wellness":["health","fa-heart-pulse"],"Sports & Events":["sports","fa-trophy"],"Politics":["politics","fa-landmark"],"Cars":["cars","fa-car-side"]};
const SECCOL = {ai:"#7c3aed",gcc:"#0ea5e9",health:"#10b981",sports:"#f97316",politics:"#e11d48",cars:"#64748b"};

const m = /\/story\/([A-Za-z0-9_-]+)/.exec(location.pathname);
const id = m ? m[1] : new URLSearchParams(location.search).get("id");
let story = null, related = [], corrections = [], state = "loading", speaking = false;
const synth = window.speechSynthesis;

const lang = () => BNP.lang;
function tr(st){
  const L = lang(), arr = (st.translations||{})[L];
  const brief = L!=="en" && st.brief_translations && st.brief_translations[L];
  return { h: (arr && arr[0]) || st.headline, s: (arr && arr[1]) || st.summary,
           b: brief || (L==="en" ? st.brief : null) || null, ai: L!=="en" && !!arr };
}
const secLabel = s => t("sec_"+(SEC[s]||["ai"])[0]);
const loc = () => lang()==="ar" ? "ar-AE" : lang();
const fmt = (d, dateOnly) => new Date(d).toLocaleString(loc(), dateOnly ? {dateStyle:"long", timeZone:"Asia/Dubai"} : {dateStyle:"long", timeStyle:"short", timeZone:"Asia/Dubai"});
const savedSet = () => { try{ return new Set(JSON.parse(localStorage.getItem("beenews-saved")||"[]")); }catch(e){ return new Set(); } };
const pageUrl = () => ((window.BEENEWS_CONFIG||{}).siteUrl || location.origin).replace(/\/$/,"") + "/story/" + encodeURIComponent(id);

function draw(){
  const main = $("stMain");
  if(state==="loading"){ return; }
  if(state!=="ok"){
    main.innerHTML = `<div class="card-box" style="text-align:center;padding:40px 20px"><p style="font:600 17px var(--f-ui);margin:0 0 16px">${esc(t(state==="missing"?"stMissing":"stOffline"))}</p>
      <a class="btn btn-amber" href="/"><i class="fa-solid fa-house" aria-hidden="true"></i>${esc(t("stHome"))}</a></div>`;
    return;
  }
  const st = story, x = tr(st), [cls, icon] = SEC[st.section] || ["ai","fa-newspaper"];
  const isSaved = savedSet().has(st.id);
  document.title = x.h + " · BeeNews";
  const brief = (x.b || "").split(/\n{2,}/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("");
  const corr = corrections.length ? `<ul class="st-corr">${corrections.map(c=>`<li><b>${esc(fmt(c.corrected_at))}</b><br>${esc(c.note)}</li>`).join("")}</ul>` : `<p class="st-note">${esc(t("corrNone"))}</p>`;
  const wa = "https://wa.me/?text=" + encodeURIComponent(x.h + " " + pageUrl());
  const xurl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(x.h) + "&url=" + encodeURIComponent(pageUrl());
  $("stMain").innerHTML = `
  <article>
    <header class="st-hero sc-${cls}" style="--sc:${SECCOL[cls]}">
      <div class="hero-art" aria-hidden="true"><i class="fa-solid ${icon} hero-i"></i></div>
      <div class="st-badges">${st.breaking?`<span class="badge lab" style="background:#e11d48">${esc(t("breaking"))}</span>`:""}
        <span class="kick"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${esc(secLabel(st.section))} · ${esc(t("c:"+st.country))}</span>
        <span class="badge lab lab-${esc(st.label)}"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${esc(t("lab_"+st.label))}</span></div>
      <h1>${esc(x.h)}</h1>
      <div class="st-meta"><span><i class="fa-regular fa-newspaper" aria-hidden="true"></i> ${esc(t("source"))}: <b>${esc(st.publisher)}</b></span>
        <span><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(t("published"))} <time datetime="${esc(st.published_at)}">${esc(fmt(st.published_at, st.date_only))}</time></span>
        ${(new Date(st.updated_at) - new Date(st.published_at) > 3600e3 && corrections.length) ? `<span>${esc(t("updated"))} ${esc(fmt(st.updated_at))}</span>`:""}</div>
      <div class="st-actions">
        <button type="button" class="act" id="stListen" aria-pressed="${speaking}"><i class="fa-solid ${speaking?"fa-stop":"fa-headphones"}" aria-hidden="true"></i>${esc(t(speaking?"stop":"listen"))}</button>
        <button type="button" class="act" id="stSave" aria-pressed="${isSaved}"><i class="${isSaved?"fa-solid":"fa-regular"} fa-bookmark" aria-hidden="true"></i>${esc(t(isSaved?"saved":"save"))}</button>
        <a class="act" href="${esc(st.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>${esc(t("readOrig"))}</a>
      </div>
    </header>
    <div class="st-body">
      <div>
        <p class="lead-p">${esc(x.s)}</p>
        <section class="brief card-box">${brief?`<h2 style="margin:0 0 6px;font:800 18px var(--f-ui);color:var(--ink)">${esc(t("briefH"))}</h2>${brief}`:""}
          <p class="st-note">${esc(t("briefNote"))}${x.ai?" "+esc(t("aiNote")):""}</p>
          <p><a class="btn btn-dark" href="${esc(st.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>${esc(t("readOrig"))} · ${esc(st.publisher)}</a></p>
          ${st.also_reported?`<p class="st-note">${esc(t("also"))}: ${esc(st.also_reported)}</p>`:""}</section>
        <section class="card-box" style="margin-top:18px"><h3 style="margin:0 0 10px;font:800 15px var(--f-ui)"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> ${esc(t("share"))}</h3>
          <div class="share-row"><a class="wa" href="${wa}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i>WhatsApp</a>
            <a href="${xurl}" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i>X</a>
            <button type="button" id="stCopy"><i class="fa-solid fa-link" aria-hidden="true"></i><span>${esc(t("copy"))}</span></button>
            ${navigator.share?`<button type="button" id="stShare"><i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>${esc(t("share"))}</button>`:""}</div></section>
      </div>
      <aside class="st-side">
        <div class="card-box"><h3><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>${esc(t("verifyH"))}</h3>
          <p class="st-note"><b>${esc(t("lab_"+st.label))}:</b> ${esc(t("labd_"+st.label))}</p>
          <p class="st-note"><a href="/editorial.html">${esc(BNP.t("editorial"))} →</a></p></div>
        <div class="card-box"><h3><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>${esc(t("corrH"))}</h3>${corr}</div>
        <div class="card-box"><h3><i class="fa-solid fa-flag" aria-hidden="true"></i>${esc(t("reportH"))}</h3><p class="st-note">${esc(t("reportP"))}</p>
          <button type="button" class="btn btn-ghost" id="stReportBtn">${esc(t("report"))}</button>
          <form class="form" id="stReport" hidden novalidate style="margin-top:12px">
            <label>${esc(t("rKind"))}<select name="kind"><option value="factual">${esc(t("rFact"))}</option><option value="translation">${esc(t("rTrans"))}</option><option value="link">${esc(t("rLink"))}</option><option value="offensive">${esc(t("rOff"))}</option><option value="other">${esc(t("rOther"))}</option></select></label>
            <label>${esc(t("rMsg"))}<textarea name="message" maxlength="2000" required></textarea></label>
            <label>${esc(t("rEmail"))}<input name="email" type="email" autocomplete="email"></label>
            <button class="btn btn-amber" type="submit">${esc(t("rSend"))}</button><div class="rmsg" role="status" aria-live="polite"></div></form></div>
      </aside>
    </div>
  </article>
  ${related.length?`<section class="st-related"><h2 style="font:800 20px var(--f-ui)">${esc(t("related"))}</h2><div class="rel-grid">${related.map(r=>{ const y = tr(r);
    return `<a class="rel-card" href="/story/${encodeURIComponent(r.id)}"><span class="kick">${esc(t("lab_"+r.label))} · ${esc(r.publisher)}</span><b>${esc(y.h)}</b><span class="st-note">${esc(fmt(r.published_at, r.date_only))}</span></a>`; }).join("")}</div></section>`:""}`;
  wire();
}

function wire(){
  $("stListen").onclick = ()=>{
    if(!synth){ alertMsg(t("noVoice")); return; }
    if(speaking){ synth.cancel(); speaking = false; return draw(); }
    const x = tr(story);
    const u = new SpeechSynthesisUtterance(`${x.h}. ${x.b || x.s} ${t("source")}: ${story.publisher}.`);
    u.lang = {en:"en-GB", ar:"ar-AE", fr:"fr-FR", de:"de-DE"}[lang()];
    const v = synth.getVoices().find(v=>v.lang && v.lang.toLowerCase().startsWith(lang())); if(v) u.voice = v;
    u.onend = u.onerror = ()=>{ speaking = false; draw(); };
    synth.cancel(); synth.speak(u); speaking = true; draw();
    track("listen", story.id);
  };
  $("stSave").onclick = async ()=>{
    const s = savedSet(), on = !s.has(story.id);
    on ? s.add(story.id) : s.delete(story.id);
    try{ localStorage.setItem("beenews-saved", JSON.stringify([...s])); }catch(e){}
    draw();
    const uid = await userId();
    if(uid){ on ? BNP.sb.from("saved_stories").upsert({user_id:uid, story_id:story.id},{onConflict:"user_id,story_id", ignoreDuplicates:true}).then(()=>{})
                : BNP.sb.from("saved_stories").delete().eq("user_id",uid).eq("story_id",story.id).then(()=>{}); }
    if(on) track("save", story.id);
  };
  $("stCopy").onclick = async ()=>{
    try{ await navigator.clipboard.writeText(pageUrl()); $("stCopy").querySelector("span").textContent = t("copied"); }catch(e){ prompt(t("copy"), pageUrl()); }
    track("share","copy");
  };
  if($("stShare")) $("stShare").onclick = ()=>{ navigator.share({title:tr(story).h, url:pageUrl()}).then(()=>track("share","native"),()=>{}); };
  document.querySelectorAll(".share-row a").forEach(a=>a.addEventListener("click", ()=>track("share", a.classList.contains("wa")?"whatsapp":"x")));
  $("stReportBtn").onclick = ()=>{ $("stReport").hidden = false; $("stReportBtn").hidden = true; $("stReport").message.focus(); };
  $("stReport").onsubmit = async e=>{
    e.preventDefault();
    const f = e.target, out = f.querySelector(".rmsg"), message = f.message.value.trim(), email = f.email.value.trim();
    const say = (k, ok)=>{ out.className = "rmsg msg " + (ok?"ok":"err"); out.textContent = t(k); };
    if(message.length < 5) return say("rShort");
    if(!BNP.sb) return say("rFail");
    f.querySelector("button").disabled = true;
    const uid = await userId();
    const {error} = await BNP.sb.from("error_reports").insert({story_id:story.id, kind:f.kind.value, message,
      contact_email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null, user_id: uid});
    f.querySelector("button").disabled = false;
    if(error){ console.warn("BeeNews: report", error); return say("rFail"); }
    f.reset(); say("rThanks", true); track("report_error", story.id);
  };
}
function alertMsg(s){ const b = document.createElement("div"); b.className = "msg err"; b.textContent = s; $("stMain").prepend(b); setTimeout(()=>b.remove(), 4000); }
async function userId(){ if(!BNP.sb) return null; try{ const {data} = await BNP.sb.auth.getSession(); return data.session ? data.session.user.id : null; }catch(e){ return null; } }
function track(name, key){ if(BNP.sb && (window.BEENEWS_CONFIG||{}).analytics !== false) BNP.sb.rpc("track",{event_name:name, event_key:String(key||"").slice(0,80)}).then(()=>{},()=>{}); }

async function load(){
  if(!id || !BNP.sb){ state = id ? "offline" : "missing"; return draw(); }
  try{
    const {data, error} = await BNP.sb.from("stories").select("*").eq("id", id).eq("status","published").maybeSingle();
    if(error) throw error;
    if(!data){ state = "missing"; return draw(); }
    story = data; state = "ok";
    const [c, r] = await Promise.allSettled([
      BNP.sb.from("story_corrections").select("note,corrected_at").eq("story_id", id).order("corrected_at",{ascending:false}),
      BNP.sb.from("stories").select("id,headline,translations,label,publisher,published_at,date_only").eq("status","published")
        .eq("section", data.section).neq("id", id).order("published_at",{ascending:false}).limit(4)
    ]);
    if(c.status==="fulfilled" && c.value.data) corrections = c.value.data;
    if(r.status==="fulfilled" && r.value.data) related = r.value.data;
    draw();
    track("story_open", id);
    const uid = await userId();
    if(uid) BNP.sb.from("reading_history").upsert({user_id:uid, story_id:id, read_at:new Date().toISOString()},{onConflict:"user_id,story_id"}).then(()=>{});
  }catch(e){ console.warn("BeeNews: story load", e); state = "offline"; draw(); }
}
BNP.onLang = ()=>{ if(speaking){ synth.cancel(); speaking = false; } draw(); };
BNP.render();
load();
})();
