/* BeeNews — Supabase layer: accounts, saved preferences, "For You" homepage and live content.
   Runs after the main page script and reuses its globals (S, EV, T, lang, card, showView, ...).
   Without a Supabase config it runs in demo mode: bundled edition, preferences kept on this device. */
(function(){
"use strict";
const CFG = window.BEENEWS_CONFIG || {};
const sb = (CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, detectSessionInUrl:true}})
  : null;
const STORY_SECTIONS = ["AI","GCC","Health & Wellness","Sports & Events","Politics","Cars"];
const COUNTRIES = ["UAE","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Morocco","Philippines","International"];
const DEFAULTS = {language:null, sections:[], countries:[], horoscope_sign:null, currencies:["INR","EUR","GBP"]};
let session = null, profileName = "", prefs = loadLocal();

/* ---------- strings ---------- */
const BT = {
 en:{signIn:"Sign in",account:"Account",customise:"Customise",forYou:"For You",fyEmptyH:"Make BeeNews yours",
  fyEmptyP:"Choose the sections and countries you always want to see first, plus your currencies and star sign.",
  fyEdit:"Edit",fyNone:"No stories match your picks in this edition yet.",myMarkets:"My currencies",mySign:"My sign",
  cTitle:"Customise my homepage",cSections:"Sections to feature",cCountries:"Countries to follow",cLang:"Language",
  cSign:"Horoscope sign",cNoSign:"None",cCur:"Currencies to watch",cSave:"Save",cCancel:"Cancel",cSaved:"Saved.",
  cSavedLocal:"Saved on this device. Sign in to keep your homepage on every device.",
  aTitleIn:"Sign in to BeeNews",aTitleUp:"Create your BeeNews account",aTitleReset:"Reset your password",aTitleNew:"Choose a new password",
  aEmail:"Email",aPassword:"Password",aName:"Name",aCreate:"Create account",aGoogle:"Continue with Google",
  aNoAcct:"New to BeeNews? Create an account",aHaveAcct:"Already have an account? Sign in",aForgot:"Forgot password?",
  aSendLink:"Send reset link",aBack:"Back to sign in",aUpdate:"Update password",
  aCheckEmail:"Check your email to confirm your account, then sign in.",aResetSent:"If that email has an account, a reset link is on its way.",
  aPwUpdated:"Password updated. You're signed in.",aPwRule:"At least 8 characters.",
  aDemo:"Accounts aren't connected yet. You can still customise your homepage; it will be saved on this device.",
  mSignedInAs:"Signed in as",mSignOut:"Sign out",mDelete:"Delete account",mDeleteQ:"This permanently deletes your account and saved preferences.",
  mDeleteYes:"Yes, delete my account",mDeleted:"Your account has been deleted.",close:"Close",
  errGeneric:"Something went wrong. Please try again.",errOffline:"Couldn't reach BeeNews. Showing the saved edition."},
 ar:{signIn:"تسجيل الدخول",account:"الحساب",customise:"تخصيص",forYou:"لك",fyEmptyH:"اجعل BeeNews على ذوقك",
  fyEmptyP:"اختر الأقسام والدول التي تريد رؤيتها أولاً، إضافة إلى عملاتك وبرجك.",
  fyEdit:"تعديل",fyNone:"لا توجد أخبار تطابق اختياراتك في هذا العدد بعد.",myMarkets:"عملاتي",mySign:"برجي",
  cTitle:"تخصيص صفحتي الرئيسية",cSections:"الأقسام المفضلة",cCountries:"الدول التي أتابعها",cLang:"اللغة",
  cSign:"البرج",cNoSign:"بدون",cCur:"العملات التي أتابعها",cSave:"حفظ",cCancel:"إلغاء",cSaved:"تم الحفظ.",
  cSavedLocal:"حُفظت على هذا الجهاز. سجّل الدخول لتبقى صفحتك على كل أجهزتك.",
  aTitleIn:"تسجيل الدخول إلى BeeNews",aTitleUp:"إنشاء حساب BeeNews",aTitleReset:"إعادة تعيين كلمة المرور",aTitleNew:"اختر كلمة مرور جديدة",
  aEmail:"البريد الإلكتروني",aPassword:"كلمة المرور",aName:"الاسم",aCreate:"إنشاء حساب",aGoogle:"المتابعة باستخدام Google",
  aNoAcct:"جديد على BeeNews؟ أنشئ حساباً",aHaveAcct:"لديك حساب؟ سجّل الدخول",aForgot:"نسيت كلمة المرور؟",
  aSendLink:"إرسال رابط إعادة التعيين",aBack:"العودة لتسجيل الدخول",aUpdate:"تحديث كلمة المرور",
  aCheckEmail:"تحقق من بريدك لتأكيد حسابك، ثم سجّل الدخول.",aResetSent:"إن كان لهذا البريد حساب، فسيصلك رابط إعادة التعيين.",
  aPwUpdated:"تم تحديث كلمة المرور وتسجيل دخولك.",aPwRule:"8 أحرف على الأقل.",
  aDemo:"الحسابات غير مفعّلة بعد. يمكنك تخصيص صفحتك الرئيسية وستُحفظ على هذا الجهاز.",
  mSignedInAs:"مسجّل باسم",mSignOut:"تسجيل الخروج",mDelete:"حذف الحساب",mDeleteQ:"سيُحذف حسابك وتفضيلاتك المحفوظة نهائياً.",
  mDeleteYes:"نعم، احذف حسابي",mDeleted:"تم حذف حسابك.",close:"إغلاق",
  errGeneric:"حدث خطأ. حاول مرة أخرى.",errOffline:"تعذّر الوصول إلى BeeNews. نعرض العدد المحفوظ."},
 fr:{signIn:"Se connecter",account:"Compte",customise:"Personnaliser",forYou:"Pour vous",fyEmptyH:"Faites de BeeNews votre journal",
  fyEmptyP:"Choisissez les rubriques et pays à voir en premier, ainsi que vos devises et votre signe.",
  fyEdit:"Modifier",fyNone:"Aucun article ne correspond encore à vos choix dans cette édition.",myMarkets:"Mes devises",mySign:"Mon signe",
  cTitle:"Personnaliser ma page d'accueil",cSections:"Rubriques à mettre en avant",cCountries:"Pays à suivre",cLang:"Langue",
  cSign:"Signe astrologique",cNoSign:"Aucun",cCur:"Devises à suivre",cSave:"Enregistrer",cCancel:"Annuler",cSaved:"Enregistré.",
  cSavedLocal:"Enregistré sur cet appareil. Connectez-vous pour retrouver votre page partout.",
  aTitleIn:"Connexion à BeeNews",aTitleUp:"Créer votre compte BeeNews",aTitleReset:"Réinitialiser le mot de passe",aTitleNew:"Nouveau mot de passe",
  aEmail:"E-mail",aPassword:"Mot de passe",aName:"Nom",aCreate:"Créer un compte",aGoogle:"Continuer avec Google",
  aNoAcct:"Nouveau sur BeeNews ? Créer un compte",aHaveAcct:"Déjà un compte ? Se connecter",aForgot:"Mot de passe oublié ?",
  aSendLink:"Envoyer le lien",aBack:"Retour à la connexion",aUpdate:"Mettre à jour",
  aCheckEmail:"Vérifiez votre e-mail pour confirmer votre compte, puis connectez-vous.",aResetSent:"Si un compte existe pour cet e-mail, un lien est en route.",
  aPwUpdated:"Mot de passe mis à jour. Vous êtes connecté.",aPwRule:"8 caractères minimum.",
  aDemo:"Les comptes ne sont pas encore activés. Vous pouvez personnaliser votre page ; elle sera enregistrée sur cet appareil.",
  mSignedInAs:"Connecté en tant que",mSignOut:"Se déconnecter",mDelete:"Supprimer le compte",mDeleteQ:"Votre compte et vos préférences seront définitivement supprimés.",
  mDeleteYes:"Oui, supprimer mon compte",mDeleted:"Votre compte a été supprimé.",close:"Fermer",
  errGeneric:"Une erreur s'est produite. Réessayez.",errOffline:"BeeNews est injoignable. Affichage de l'édition enregistrée."},
 de:{signIn:"Anmelden",account:"Konto",customise:"Anpassen",forYou:"Für Sie",fyEmptyH:"Machen Sie BeeNews zu Ihrer Zeitung",
  fyEmptyP:"Wählen Sie Rubriken und Länder, die Sie zuerst sehen möchten, dazu Ihre Währungen und Ihr Sternzeichen.",
  fyEdit:"Bearbeiten",fyNone:"In dieser Ausgabe passen noch keine Meldungen zu Ihrer Auswahl.",myMarkets:"Meine Währungen",mySign:"Mein Sternzeichen",
  cTitle:"Startseite anpassen",cSections:"Bevorzugte Rubriken",cCountries:"Länder folgen",cLang:"Sprache",
  cSign:"Sternzeichen",cNoSign:"Keins",cCur:"Beobachtete Währungen",cSave:"Speichern",cCancel:"Abbrechen",cSaved:"Gespeichert.",
  cSavedLocal:"Auf diesem Gerät gespeichert. Melden Sie sich an, um Ihre Startseite überall zu haben.",
  aTitleIn:"Bei BeeNews anmelden",aTitleUp:"BeeNews-Konto erstellen",aTitleReset:"Passwort zurücksetzen",aTitleNew:"Neues Passwort wählen",
  aEmail:"E-Mail",aPassword:"Passwort",aName:"Name",aCreate:"Konto erstellen",aGoogle:"Weiter mit Google",
  aNoAcct:"Neu bei BeeNews? Konto erstellen",aHaveAcct:"Schon ein Konto? Anmelden",aForgot:"Passwort vergessen?",
  aSendLink:"Link senden",aBack:"Zurück zur Anmeldung",aUpdate:"Passwort ändern",
  aCheckEmail:"Bitte bestätigen Sie Ihr Konto per E-Mail und melden Sie sich dann an.",aResetSent:"Falls ein Konto existiert, ist ein Link unterwegs.",
  aPwUpdated:"Passwort geändert. Sie sind angemeldet.",aPwRule:"Mindestens 8 Zeichen.",
  aDemo:"Konten sind noch nicht verbunden. Sie können Ihre Startseite trotzdem anpassen; sie wird auf diesem Gerät gespeichert.",
  mSignedInAs:"Angemeldet als",mSignOut:"Abmelden",mDelete:"Konto löschen",mDeleteQ:"Ihr Konto und Ihre Einstellungen werden endgültig gelöscht.",
  mDeleteYes:"Ja, Konto löschen",mDeleted:"Ihr Konto wurde gelöscht.",close:"Schließen",
  errGeneric:"Etwas ist schiefgelaufen. Bitte erneut versuchen.",errOffline:"BeeNews ist nicht erreichbar. Die gespeicherte Ausgabe wird angezeigt."}
};
for (const l of Object.keys(BT)) Object.assign(T[l], BT[l]);

/* ---------- small helpers ---------- */
const h = (tag, attrs={}, html="") => { const e=document.createElement(tag); for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); e.innerHTML=html; return e; };
function loadLocal(){ try{ return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem("beenews-prefs")||"{}")); }catch(e){ return Object.assign({}, DEFAULTS); } }
function saveLocal(p){ try{ localStorage.setItem("beenews-prefs", JSON.stringify(p)); }catch(e){} }
function dubaiDate(d){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(d); }
function friendlyError(err){ return (err && err.message) ? err.message : t("errGeneric"); }

/* ---------- chrome: account button, customise button, For You section, dialogs ---------- */
const acctBtn = h("button",{id:"acctBtn",class:"acct",type:"button"});
const langsw = $("langsw"); langsw.parentNode.insertBefore(acctBtn, langsw);
const custBtn = h("button",{id:"custBtn",class:"custbtn",type:"button"});
$("tabs").parentNode.insertBefore(custBtn, $("ftoggle"));
const fy = h("section",{id:"foryou",class:"foryou","aria-labelledby":"fyTitle"});
$("index").parentNode.insertBefore(fy, $("index"));
const dlg = h("dialog",{id:"bnDialog",class:"bn-dialog"});
document.body.appendChild(dlg);
dlg.addEventListener("click", e=>{ if(e.target===dlg) dlg.close(); });

function openDialog(render){ render(); if(!dlg.open) dlg.showModal(); const f=dlg.querySelector("input,select,button.primary"); if(f) f.focus(); }
function msg(text, kind){ const m=dlg.querySelector(".dmsg"); if(m){ m.textContent=text; m.dataset.kind=kind||"info"; m.hidden=!text; } }
function busy(form, on){ form.querySelectorAll("button,input,select").forEach(x=>x.disabled=on); }

/* ----- auth dialog ----- */
function authView(view){
  const head = {signin:"aTitleIn",signup:"aTitleUp",reset:"aTitleReset",newpass:"aTitleNew"}[view];
  if(!sb){
    dlg.innerHTML = `<form method="dialog" class="dbody"><h2>${esc(t("aTitleIn"))}</h2><p class="dnote">${esc(t("aDemo"))}</p>
      <div class="dactions"><button class="primary" type="button" id="dCust">${esc(t("customise"))}</button><button value="close">${esc(t("close"))}</button></div></form>`;
    dlg.querySelector("#dCust").onclick = ()=>openDialog(customiseView);
    return;
  }
  const email = `<label>${esc(t("aEmail"))}<input type="email" name="email" autocomplete="email" required></label>`;
  const pw = (ac)=>`<label>${esc(t("aPassword"))}<input type="password" name="password" autocomplete="${ac}" minlength="8" required><small>${esc(t("aPwRule"))}</small></label>`;
  let body = "";
  if(view==="signin") body = email+pw("current-password")+`<button class="primary" type="submit">${esc(t("signIn"))}</button>
      <button type="button" class="google" id="dGoogle">${esc(t("aGoogle"))}</button>
      <div class="dlinks"><button type="button" class="link" data-v="reset">${esc(t("aForgot"))}</button><button type="button" class="link" data-v="signup">${esc(t("aNoAcct"))}</button></div>`;
  if(view==="signup") body = `<label>${esc(t("aName"))}<input name="name" autocomplete="name" maxlength="80"></label>`+email+pw("new-password")+
      `<button class="primary" type="submit">${esc(t("aCreate"))}</button><button type="button" class="google" id="dGoogle">${esc(t("aGoogle"))}</button>
      <div class="dlinks"><button type="button" class="link" data-v="signin">${esc(t("aHaveAcct"))}</button></div>`;
  if(view==="reset") body = email+`<button class="primary" type="submit">${esc(t("aSendLink"))}</button>
      <div class="dlinks"><button type="button" class="link" data-v="signin">${esc(t("aBack"))}</button></div>`;
  if(view==="newpass") body = pw("new-password")+`<button class="primary" type="submit">${esc(t("aUpdate"))}</button>`;
  dlg.innerHTML = `<form class="dbody" novalidate><div class="dhead"><h2>${esc(t(head))}</h2><button type="button" class="x" aria-label="${esc(t("close"))}">×</button></div>
    <p class="dmsg" hidden role="status"></p>${body}</form>`;
  const form = dlg.querySelector("form");
  dlg.querySelector(".x").onclick = ()=>dlg.close();
  dlg.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>openDialog(()=>authView(b.dataset.v)));
  const g = dlg.querySelector("#dGoogle");
  if(g) g.onclick = async ()=>{ const {error} = await sb.auth.signInWithOAuth({provider:"google", options:{redirectTo:location.origin+location.pathname}}); if(error) msg(friendlyError(error),"error"); };
  form.onsubmit = async (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    const f = Object.fromEntries(new FormData(form)); busy(form,true); msg("");
    try{
      if(view==="signin"){ const {error} = await sb.auth.signInWithPassword({email:f.email, password:f.password}); if(error) throw error; dlg.close(); }
      if(view==="signup"){
        const {data,error} = await sb.auth.signUp({email:f.email, password:f.password, options:{emailRedirectTo:location.origin+location.pathname, data:{display_name:f.name||"", language:lang}}});
        if(error) throw error;
        if(data.session){ dlg.close(); } else { msg(t("aCheckEmail"),"ok"); }
      }
      if(view==="reset"){ const {error} = await sb.auth.resetPasswordForEmail(f.email,{redirectTo:location.origin+location.pathname}); if(error) throw error; msg(t("aResetSent"),"ok"); }
      if(view==="newpass"){ const {error} = await sb.auth.updateUser({password:f.password}); if(error) throw error; msg(t("aPwUpdated"),"ok"); setTimeout(()=>dlg.close(),1200); }
    }catch(err){ msg(friendlyError(err),"error"); }
    finally{ busy(form,false); }
  };
}

/* ----- account dialog ----- */
function accountView(){
  const email = session && session.user ? session.user.email : "";
  dlg.innerHTML = `<div class="dbody"><div class="dhead"><h2>${esc(t("account"))}</h2><button type="button" class="x" aria-label="${esc(t("close"))}">×</button></div>
    <p class="dmsg" hidden role="status"></p>
    <p class="dnote">${esc(t("mSignedInAs"))} <b>${esc(profileName||email)}</b><br><span class="mono">${esc(email)}</span></p>
    <div class="dactions"><button class="primary" type="button" id="dCust">${esc(t("customise"))}</button><button type="button" id="dOut">${esc(t("mSignOut"))}</button></div>
    <div class="danger"><button type="button" class="link dangerlink" id="dDel">${esc(t("mDelete"))}</button>
      <div id="dDelConfirm" hidden><p>${esc(t("mDeleteQ"))}</p><button type="button" class="dangerbtn" id="dDelYes">${esc(t("mDeleteYes"))}</button> <button type="button" id="dDelNo">${esc(t("cCancel"))}</button></div></div></div>`;
  dlg.querySelector(".x").onclick = ()=>dlg.close();
  dlg.querySelector("#dCust").onclick = ()=>openDialog(customiseView);
  dlg.querySelector("#dOut").onclick = async ()=>{ await sb.auth.signOut(); dlg.close(); };
  dlg.querySelector("#dDel").onclick = ()=>{ dlg.querySelector("#dDelConfirm").hidden=false; };
  dlg.querySelector("#dDelNo").onclick = ()=>{ dlg.querySelector("#dDelConfirm").hidden=true; };
  dlg.querySelector("#dDelYes").onclick = async ()=>{
    const {error} = await sb.rpc("delete_my_account");
    if(error){ msg(friendlyError(error),"error"); return; }
    await sb.auth.signOut(); prefs = Object.assign({},DEFAULTS); saveLocal(prefs); applyPrefs();
    msg(t("mDeleted"),"ok"); setTimeout(()=>dlg.close(),1500);
  };
}

/* ----- customise dialog ----- */
function customiseView(){
  const box = (name, val, label, on) => `<label class="opt"><input type="checkbox" name="${name}" value="${esc(val)}"${on?" checked":""}><span>${esc(label)}</span></label>`;
  const sec = STORY_SECTIONS.map(s=>box("sections", s, secName(s), prefs.sections.includes(s))).join("");
  const ctr = COUNTRIES.map(c=>box("countries", c, ctry(c), prefs.countries.includes(c))).join("");
  const cur = FXR.map(f=>box("currencies", f.c, f.c, prefs.currencies.includes(f.c))).join("");
  const langs = [["en","English"],["ar","العربية"],["fr","Français"],["de","Deutsch"]].map(([v,n])=>`<option value="${v}"${(prefs.language||lang)===v?" selected":""}>${n}</option>`).join("");
  const signs = `<option value="">${esc(t("cNoSign"))}</option>`+SIGNS.map(([k])=>`<option value="${k}"${prefs.horoscope_sign===k?" selected":""}>${esc(t(k))}</option>`).join("");
  dlg.innerHTML = `<form class="dbody wide"><div class="dhead"><h2>${esc(t("cTitle"))}</h2><button type="button" class="x" aria-label="${esc(t("close"))}">×</button></div>
    <p class="dmsg" hidden role="status"></p>
    <fieldset><legend>${esc(t("cSections"))}</legend><div class="opts">${sec}</div></fieldset>
    <fieldset><legend>${esc(t("cCountries"))}</legend><div class="opts">${ctr}</div></fieldset>
    <div class="row2"><label>${esc(t("cLang"))}<select name="language">${langs}</select></label>
      <label>${esc(t("cSign"))}<select name="horoscope_sign">${signs}</select></label></div>
    <fieldset><legend>${esc(t("cCur"))}</legend><div class="opts">${cur}</div></fieldset>
    <div class="dactions"><button class="primary" type="submit">${esc(t("cSave"))}</button><button type="button" id="dCancel">${esc(t("cCancel"))}</button></div></form>`;
  const form = dlg.querySelector("form");
  dlg.querySelector(".x").onclick = dlg.querySelector("#dCancel").onclick = ()=>dlg.close();
  form.onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const next = {language: fd.get("language")||null, sections: fd.getAll("sections"), countries: fd.getAll("countries"),
                  horoscope_sign: fd.get("horoscope_sign")||null, currencies: fd.getAll("currencies")};
    busy(form,true); msg("");
    try{
      prefs = Object.assign({}, DEFAULTS, next); saveLocal(prefs);
      if(sb && session){
        const {error} = await sb.from("user_preferences").upsert(Object.assign({user_id:session.user.id}, next));
        if(error) throw error;
        msg(t("cSaved"),"ok");
      } else msg(t("cSavedLocal"),"ok");
      applyPrefs();
      setTimeout(()=>{ if(dlg.open) dlg.close(); }, 900);
    }catch(err){ msg(friendlyError(err),"error"); }
    finally{ busy(form,false); }
  };
}

acctBtn.onclick = ()=> openDialog(session ? accountView : ()=>authView("signin"));
custBtn.onclick = ()=> openDialog(customiseView);

/* ---------- For You homepage ---------- */
function renderForYou(){
  if(state.sec!=="All"){ fy.hidden = true; return; }
  fy.hidden = false;
  const hasPicks = prefs.sections.length || prefs.countries.length;
  if(!hasPicks){
    fy.innerHTML = `<div class="fy-empty"><div><h2 id="fyTitle">${esc(t("fyEmptyH"))}</h2><p>${esc(t("fyEmptyP"))}</p></div>
      <div class="fy-cta"><button class="cta-solid" type="button" data-act="cust">${esc(t("customise"))}</button>${(!session && sb)?`<button class="cta-ghost" type="button" data-act="signin">${esc(t("signIn"))}</button>`:""}</div></div>`;
  } else {
    const picks = S.filter(st=>prefs.sections.includes(st.sec)||prefs.countries.includes(st.country))
                   .sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,6);
    const chips = [...prefs.sections.map(s=>`<span class="fy-chip sc-${SECCLS[s]}">${esc(secName(s))}</span>`),
                   ...prefs.countries.map(c=>`<span class="fy-chip">${esc(ctry(c))}</span>`)].join("");
    const cur = prefs.currencies.map(c=>FXR.find(f=>f.c===c)).filter(Boolean)
      .map(f=>`<li><b>${f.c}</b><span>1 AED = ${nf(1/f.r, 1/f.r<1?4:2)}</span></li>`).join("");
    const sg = prefs.horoscope_sign && SIGNS.find(x=>x[0]===prefs.horoscope_sign);
    fy.innerHTML = `<div class="fy-head"><h2 id="fyTitle">${esc(t("forYou"))}</h2><div class="fy-chips">${chips}</div>
        <button class="cta-ghost sm" type="button" data-act="cust">${esc(t("fyEdit"))}</button></div>
      <div class="fy-body"><div class="fy-grid">${picks.length?picks.map(card).join(""):`<p class="fy-none">${esc(t("fyNone"))}</p>`}</div>
      <aside class="fy-side">${cur?`<div class="fy-box sc-markets"><h3>${esc(t("myMarkets"))}</h3><ul>${cur}</ul></div>`:""}
        ${sg?`<div class="fy-box sc-horo"><h3>${esc(t("mySign"))} · ${esc(t(sg[0]))} ${sg[1]}</h3><p>${esc((HORO[lang]||HORO.en)[sg[0]]||"")}</p></div>`:""}</aside></div>`;
  }
  fy.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>openDialog(b.dataset.act==="cust"?customiseView:()=>authView("signin")));
}

function refreshChrome(){
  acctBtn.textContent = session ? (profileName || (session.user.email||"").split("@")[0] || t("account")) : t("signIn");
  acctBtn.dataset.state = session ? "in" : "out";
  custBtn.textContent = t("customise");
}

// Re-render For You whenever the page view or language changes.
const baseShowView = showView;
showView = function(){ baseShowView(); renderForYou(); refreshChrome(); if(typeof fx==="function") fx(); };

function applyPrefs(){
  if(prefs.horoscope_sign !== undefined) { mySign = prefs.horoscope_sign; }
  if(prefs.language && prefs.language!==lang) setLang(prefs.language);
  else showView();
}

/* ---------- live content from Supabase ---------- */
async function loadContent(){
  const today = dubaiDate(new Date());
  const [st, ev, fxr, mq, hr] = await Promise.all([
    sb.from("stories").select("*").eq("status","published").order("published_at",{ascending:false}).limit(300),
    sb.from("events").select("*").eq("status","published"),
    sb.from("fx_rates").select("*").order("sort"),
    sb.from("market_quotes").select("*").order("sort"),
    sb.from("horoscopes").select("*").eq("day", today)
  ]);
  for (const r of [st,ev,fxr,mq,hr]) if(r.error) throw r.error;
  if(st.data.length){
    S.splice(0, S.length, ...st.data.map(r=>({id:r.id, sec:r.section, country:r.country, lab:r.label, sens:r.sensitive && !r.editor_approved,
      h:r.headline, s:r.summary, pub:r.publisher, t:r.published_at, dateOnly:r.date_only, url:r.url, section:r.link_is_section,
      also:r.also_reported||undefined, lead:r.is_lead})));
    for(const r of st.data) for(const [l,v] of Object.entries(r.translations||{})){ (C[l]=C[l]||{})[r.id]=v; }
    NOW = new Date(); TODAY = today;
  }
  if(ev.data.length){
    EV.splice(0, EV.length, ...ev.data.map(r=>({n:r.name, cat:r.category, em:r.emirate, start:r.start_date, end:r.end_date, approx:r.end_approx,
      venue:r.venue, entry:r.entry, d:r.description, lab:r.label, pub:r.publisher, url:r.url, also:r.also_reported||undefined, resched:r.rescheduled})));
    for(const r of ev.data) for(const [l,v] of Object.entries(r.translations||{})){ (CE[l]=CE[l]||{})[r.name]=v; }
  }
  if(fxr.data.length) FXR.splice(0, FXR.length, ...fxr.data.map(r=>({c:r.code, r:+r.aed_per_unit, per:r.per_units>1?r.per_units:undefined, src:r.source, d:r.as_of})));
  if(mq.data.length){
    const q = k => mq.data.filter(r=>r.kind===k);
    GULF.splice(0, GULF.length, ...q("gulf").map(r=>({k:r.country_key, n:r.name, v:+r.value, ch:+r.change_pct})));
    GLOBAL.splice(0, GLOBAL.length, ...q("global").map(r=>({n:r.name, v:+r.value, ch:+r.change_pct})));
    CMD.splice(0, CMD.length, ...q("commodity").map(r=>({k:r.name, v:+r.value, ch:+r.change_pct})));
    MK_ASOF = mq.data.map(r=>r.as_of).sort().pop();
  }
  if(hr.data.length) for(const r of hr.data){ (HORO[r.lang]=HORO[r.lang]||{})[r.sign]=r.body; }
}

async function loadRemotePrefs(){
  const uid = session.user.id;
  const [p, pr] = await Promise.all([
    sb.from("user_preferences").select("*").eq("user_id", uid).maybeSingle(),
    sb.from("profiles").select("display_name").eq("id", uid).maybeSingle()
  ]);
  if(pr.data) profileName = pr.data.display_name || "";
  if(p.data){
    prefs = Object.assign({}, DEFAULTS, {language:p.data.language, sections:p.data.sections||[], countries:p.data.countries||[],
      horoscope_sign:p.data.horoscope_sign, currencies:p.data.currencies||DEFAULTS.currencies});
    saveLocal(prefs);
  }
}

/* ---------- start ---------- */
async function start(){
  refreshChrome();
  if(!sb){ applyPrefs(); return; }
  try{ await loadContent(); }catch(e){ console.warn("BeeNews: content load failed", e); }
  buildChrome();
  const {data} = await sb.auth.getSession();
  session = data.session;
  if(session){ try{ await loadRemotePrefs(); }catch(e){ console.warn(e); } }
  applyPrefs();
  sb.auth.onAuthStateChange(async (event, s)=>{
    session = s;
    if(event==="PASSWORD_RECOVERY"){ openDialog(()=>authView("newpass")); return; }
    if(event==="SIGNED_IN"){ try{ await loadRemotePrefs(); }catch(e){} applyPrefs(); }
    if(event==="SIGNED_OUT"){ profileName=""; showView(); }
    refreshChrome();
  });
}
start();

/* installable app */
if("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
})();
