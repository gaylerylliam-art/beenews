/* BeeNews — Supabase layer: accounts, saved preferences, "For You" homepage and live content.
   Runs after the main page script and reuses its globals (S, EV, T, lang, card, showView, ...).
   Without a Supabase config it runs in demo mode: bundled edition, preferences kept on this device. */
(function(){
"use strict";
const CFG = window.BEENEWS_CONFIG || {};
const sb = (CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, detectSessionInUrl:!window.BN_NATIVE, flowType:window.BN_NATIVE?"pkce":"implicit"}})
  : null;
// Where email links and sign-in return to: this page on the web, the public site inside the app.
const siteBase = () => (window.BN_NATIVE && CFG.siteUrl) ? CFG.siteUrl.replace(/\/$/,"") + "/" : location.origin + location.pathname;
const STORY_SECTIONS = ["AI","GCC","Health & Wellness","Sports & Events","Politics","Cars"];
const COUNTRIES = ["UAE","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Morocco","Philippines","International"];
const DEFAULTS = {language:null, sections:[], countries:[], horoscope_sign:null, currencies:["INR","EUR","GBP"]};
let session = null, profileName = "", prefs = loadLocal();

/* ---------- strings ---------- */
const BT = {
 en:{cSaving:"Saving…",cUpdated:"Your homepage is updated",cUpdatedSub:"Your picks now appear first under For You.",cUpdatedLocal:"Saved on this device. Sign in to keep it on all your devices.",fyPickMore:"Choose sections or countries to see your stories here.",errSlow:"Saving is taking too long. Check your connection and try again.",view:"View",signIn:"Sign in",account:"Account",customise:"Customise",forYou:"For You",fyEmptyH:"Make BeeNews yours",
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
 ar:{cSaving:"جارٍ الحفظ…",cUpdated:"تم تحديث صفحتك الرئيسية",cUpdatedSub:"تظهر اختياراتك الآن أولاً في قسم «لك».",cUpdatedLocal:"حُفظت على هذا الجهاز. سجّل الدخول لتبقى على كل أجهزتك.",fyPickMore:"اختر أقساماً أو دولاً لتظهر أخبارك هنا.",errSlow:"الحفظ يستغرق وقتاً طويلاً. تحقق من الاتصال وحاول مجدداً.",view:"عرض",signIn:"تسجيل الدخول",account:"الحساب",customise:"تخصيص",forYou:"لك",fyEmptyH:"اجعل BeeNews على ذوقك",
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
 fr:{cSaving:"Enregistrement…",cUpdated:"Votre page d'accueil est à jour",cUpdatedSub:"Vos choix apparaissent désormais en tête, dans Pour vous.",cUpdatedLocal:"Enregistré sur cet appareil. Connectez-vous pour le retrouver partout.",fyPickMore:"Choisissez des rubriques ou des pays pour voir vos articles ici.",errSlow:"L'enregistrement prend trop de temps. Vérifiez votre connexion et réessayez.",view:"Voir",signIn:"Se connecter",account:"Compte",customise:"Personnaliser",forYou:"Pour vous",fyEmptyH:"Faites de BeeNews votre journal",
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
 de:{cSaving:"Wird gespeichert…",cUpdated:"Ihre Startseite ist aktualisiert",cUpdatedSub:"Ihre Auswahl steht jetzt oben unter „Für Sie“.",cUpdatedLocal:"Auf diesem Gerät gespeichert. Melden Sie sich an, um es überall zu haben.",fyPickMore:"Wählen Sie Rubriken oder Länder, um hier Ihre Meldungen zu sehen.",errSlow:"Das Speichern dauert zu lange. Prüfen Sie die Verbindung und versuchen Sie es erneut.",view:"Ansehen",signIn:"Anmelden",account:"Konto",customise:"Anpassen",forYou:"Für Sie",fyEmptyH:"Machen Sie BeeNews zu Ihrer Zeitung",
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
const BT2 = {
 en:{askH:"Ask BeeNews",askPh:"e.g. Show me more AI and Saudi news, and read me today's health stories",askGo:"Ask",askBusy:"Thinking…",askApplied:"Suggested settings are ticked below. Check them, then press Save.",askPlay:"Play these stories",askSignIn:"Sign in to use Ask BeeNews.",askOff:"Ask BeeNews isn't switched on yet.",askNote:"Ask BeeNews uses AI. It only changes your settings when you press Save.",
  alertsH:"Breaking-news alerts",alertsOn:"Turn on alerts",alertsOff:"Turn off alerts",alertsOnMsg:"Alerts are on for this device.",alertsOffMsg:"Alerts are off for this device.",alertsDenied:"Notifications are blocked in your browser settings.",alertsNo:"This browser doesn't support alerts.",alertsNote:"Only for major breaking stories in your chosen sections.",captchaErr:"Please complete the security check.",
  aApple:"Continue with Apple",aAgree:"I agree to the {terms} and the {privacy}.",aMarketing:"Email me the BeeNews daily briefing (optional).",aTerms:"Terms of use",aPrivacy:"Privacy policy",
  aLegalNote:"By continuing you agree to the {terms} and the {privacy}.",aMustAgree:"Please accept the Terms of use and Privacy policy to continue.",
  cnTitle:"One more step",cnBody:"Please accept our updated terms to keep using your BeeNews account.",cnAccept:"Accept and continue",cnLater:"Sign out"},
 ar:{askH:"اسأل بي نيوز",askPh:"مثال: أريد المزيد من أخبار الذكاء الاصطناعي والسعودية، واقرأ لي أخبار الصحة اليوم",askGo:"اسأل",askBusy:"جارٍ التفكير…",askApplied:"تم تحديد الإعدادات المقترحة أدناه. راجعها ثم اضغط حفظ.",askPlay:"تشغيل هذه الأخبار",askSignIn:"سجّل الدخول لاستخدام اسأل بي نيوز.",askOff:"خدمة اسأل بي نيوز غير مفعّلة بعد.",askNote:"تستخدم خدمة اسأل بي نيوز الذكاء الاصطناعي، ولا تغيّر إعداداتك إلا عند الضغط على حفظ.",
  alertsH:"تنبيهات الأخبار العاجلة",alertsOn:"تفعيل التنبيهات",alertsOff:"إيقاف التنبيهات",alertsOnMsg:"التنبيهات مفعّلة على هذا الجهاز.",alertsOffMsg:"التنبيهات متوقفة على هذا الجهاز.",alertsDenied:"الإشعارات محظورة في إعدادات المتصفح.",alertsNo:"هذا المتصفح لا يدعم التنبيهات.",alertsNote:"فقط للأخبار العاجلة المهمة في أقسامك المختارة.",captchaErr:"يرجى إكمال التحقق الأمني.",
  aApple:"المتابعة باستخدام Apple",aAgree:"أوافق على {terms} و{privacy}.",aMarketing:"أرسلوا لي موجز بي نيوز اليومي بالبريد (اختياري).",aTerms:"شروط الاستخدام",aPrivacy:"سياسة الخصوصية",
  aLegalNote:"بالمتابعة فإنك توافق على {terms} و{privacy}.",aMustAgree:"يرجى قبول شروط الاستخدام وسياسة الخصوصية للمتابعة.",
  cnTitle:"خطوة أخيرة",cnBody:"يرجى قبول شروطنا المحدّثة لمواصلة استخدام حسابك في بي نيوز.",cnAccept:"موافقة ومتابعة",cnLater:"تسجيل الخروج"},
 fr:{askH:"Demander à BeeNews",askPh:"ex. Plus d'IA et d'Arabie saoudite, et lisez-moi les actus santé du jour",askGo:"Demander",askBusy:"Réflexion…",askApplied:"Les réglages suggérés sont cochés ci-dessous. Vérifiez puis enregistrez.",askPlay:"Écouter ces articles",askSignIn:"Connectez-vous pour utiliser l'assistant.",askOff:"L'assistant n'est pas encore activé.",askNote:"L'assistant utilise l'IA. Rien ne change avant d'enregistrer.",
  alertsH:"Alertes infos urgentes",alertsOn:"Activer les alertes",alertsOff:"Désactiver les alertes",alertsOnMsg:"Alertes activées sur cet appareil.",alertsOffMsg:"Alertes désactivées sur cet appareil.",alertsDenied:"Les notifications sont bloquées dans votre navigateur.",alertsNo:"Ce navigateur ne prend pas en charge les alertes.",alertsNote:"Uniquement pour les infos majeures de vos rubriques.",captchaErr:"Veuillez compléter la vérification de sécurité.",
  aApple:"Continuer avec Apple",aAgree:"J'accepte les {terms} et la {privacy}.",aMarketing:"Recevoir le briefing quotidien BeeNews par e-mail (facultatif).",aTerms:"Conditions d'utilisation",aPrivacy:"Politique de confidentialité",
  aLegalNote:"En continuant, vous acceptez les {terms} et la {privacy}.",aMustAgree:"Veuillez accepter les conditions et la politique de confidentialité.",
  cnTitle:"Encore une étape",cnBody:"Veuillez accepter nos conditions mises à jour pour continuer à utiliser votre compte.",cnAccept:"Accepter et continuer",cnLater:"Se déconnecter"},
 de:{askH:"BeeNews fragen",askPh:"z. B. Mehr KI und Saudi-Arabien, und lies mir die heutigen Gesundheitsmeldungen vor",askGo:"Fragen",askBusy:"Denkt nach…",askApplied:"Vorgeschlagene Einstellungen sind unten markiert. Prüfen und speichern.",askPlay:"Diese Meldungen abspielen",askSignIn:"Melden Sie sich an, um den Assistenten zu nutzen.",askOff:"Der Assistent ist noch nicht aktiviert.",askNote:"Der Assistent nutzt KI. Nichts ändert sich, bevor Sie speichern.",
  alertsH:"Eilmeldungen",alertsOn:"Benachrichtigungen an",alertsOff:"Benachrichtigungen aus",alertsOnMsg:"Benachrichtigungen auf diesem Gerät an.",alertsOffMsg:"Benachrichtigungen auf diesem Gerät aus.",alertsDenied:"Benachrichtigungen sind im Browser blockiert.",alertsNo:"Dieser Browser unterstützt keine Benachrichtigungen.",alertsNote:"Nur für wichtige Eilmeldungen in Ihren Rubriken.",captchaErr:"Bitte schließen Sie die Sicherheitsprüfung ab.",
  aApple:"Weiter mit Apple",aAgree:"Ich stimme den {terms} und der {privacy} zu.",aMarketing:"BeeNews-Tagesbriefing per E-Mail erhalten (optional).",aTerms:"Nutzungsbedingungen",aPrivacy:"Datenschutzerklärung",
  aLegalNote:"Mit dem Fortfahren stimmen Sie den {terms} und der {privacy} zu.",aMustAgree:"Bitte akzeptieren Sie Nutzungsbedingungen und Datenschutzerklärung.",
  cnTitle:"Noch ein Schritt",cnBody:"Bitte akzeptieren Sie unsere aktualisierten Bedingungen, um Ihr Konto weiter zu nutzen.",cnAccept:"Akzeptieren und weiter",cnLater:"Abmelden"}
};
for (const l of Object.keys(BT)) Object.assign(T[l], BT[l], BT2[l]);
const TERMS_VERSION = "2026-10-29";
const legalLinks = key => esc(t(key)).replace("{terms}", `<a href="/terms.html" target="_blank" rel="noopener">${esc(t("aTerms"))}</a>`)
                                      .replace("{privacy}", `<a href="/privacy.html" target="_blank" rel="noopener">${esc(t("aPrivacy"))}</a>`);
let needsConsent = false;

/* ---------- small helpers ---------- */
const h = (tag, attrs={}, html="") => { const e=document.createElement(tag); for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); e.innerHTML=html; return e; };
function loadLocal(){ try{ return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem("beenews-prefs")||"{}")); }catch(e){ return Object.assign({}, DEFAULTS); } }
function saveLocal(p){ try{ localStorage.setItem("beenews-prefs", JSON.stringify(p)); }catch(e){} }
function dubaiDate(d){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(d); }
function friendlyError(err){ return (err && err.message) ? err.message : t("errGeneric"); }

/* ---------- chrome: account button, customise button, For You section, dialogs ---------- */
const acctBtn = h("button",{id:"acctBtn",class:"acct",type:"button"});
const slot = $("acctSlot"); if(slot) slot.appendChild(acctBtn); else { const langsw = $("langsw"); langsw.parentNode.insertBefore(acctBtn, langsw); }
const custBtn = h("button",{id:"custBtn",class:"custbtn",type:"button"});
$("tabs").parentNode.insertBefore(custBtn, $("ftoggle"));
const fy = h("section",{id:"foryou",class:"foryou","aria-labelledby":"fyTitle"});
$("leadwrap").parentNode.insertBefore(fy, $("leadwrap"));
const dlg = h("dialog",{id:"bnDialog",class:"bn-dialog"});
const toastEl = h("div",{id:"bnToast",class:"bn-toast",role:"status","aria-live":"polite",hidden:""});
document.body.appendChild(toastEl);
let toastTimer = null;
function toast(title, sub, action){
  toastEl.innerHTML = `<span class="tick" aria-hidden="true">✓</span><div><b>${esc(title)}</b>${sub?`<span>${esc(sub)}</span>`:""}</div>`+
    (action?`<button type="button" class="tview">${esc(action.label)}</button>`:"")+`<button type="button" class="tx" aria-label="${esc(t("close"))}">×</button>`;
  toastEl.hidden = false; toastEl.classList.remove("show"); void toastEl.offsetWidth; toastEl.classList.add("show");
  toastEl.querySelector(".tx").onclick = ()=>{ toastEl.hidden = true; };
  if(action) toastEl.querySelector(".tview").onclick = ()=>{ toastEl.hidden = true; action.run(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ toastEl.hidden = true; }, 6000);
}
const withTimeout = (pr, ms) => Promise.race([pr, new Promise((_,rej)=>setTimeout(()=>rej(new Error(t("errSlow"))), ms))]);
document.body.appendChild(dlg);
dlg.addEventListener("click", e=>{ if(e.target===dlg && !needsConsent) dlg.close(); });

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
  const oauth = `<button type="button" class="google" id="dGoogle"><i class="fa-brands fa-google" aria-hidden="true"></i> ${esc(t("aGoogle"))}</button>`+
    (CFG.appleSignIn ? `<button type="button" class="apple" id="dApple"><i class="fa-brands fa-apple" aria-hidden="true"></i> ${esc(t("aApple"))}</button>` : "")+
    `<p class="dlegal">${legalLinks("aLegalNote")}</p>`;
  if(view==="signin") body = email+pw("current-password")+`<button class="primary" type="submit">${esc(t("signIn"))}</button>
      ${oauth}
      <div class="dlinks"><button type="button" class="link" data-v="reset">${esc(t("aForgot"))}</button><button type="button" class="link" data-v="signup">${esc(t("aNoAcct"))}</button></div>`;
  if(view==="signup") body = `<label>${esc(t("aName"))}<input name="name" autocomplete="name" maxlength="80"></label>`+email+pw("new-password")+
      `<label class="consent"><input type="checkbox" name="agree" value="1" required><span>${legalLinks("aAgree")}</span></label>
      <label class="consent"><input type="checkbox" name="marketing" value="1"><span>${esc(t("aMarketing"))}</span></label>
      <button class="primary" type="submit">${esc(t("aCreate"))}</button>${oauth}
      <div class="dlinks"><button type="button" class="link" data-v="signin">${esc(t("aHaveAcct"))}</button></div>`;
  if(view==="reset") body = email+`<button class="primary" type="submit">${esc(t("aSendLink"))}</button>
      <div class="dlinks"><button type="button" class="link" data-v="signin">${esc(t("aBack"))}</button></div>`;
  if(view==="newpass") body = pw("new-password")+`<button class="primary" type="submit">${esc(t("aUpdate"))}</button>`;
  if(CFG.turnstileSiteKey && view!=="newpass") body = body.replace(/(<button class="primary" type="submit">)/, `<div class="captcha" id="dCaptcha"></div>$1`);
  dlg.innerHTML = `<form class="dbody" novalidate><div class="dhead"><h2>${esc(t(head))}</h2><button type="button" class="x" aria-label="${esc(t("close"))}">×</button></div>
    <p class="dmsg" hidden role="status"></p>${body}</form>`;
  mountCaptcha();
  const form = dlg.querySelector("form");
  dlg.querySelector(".x").onclick = ()=>dlg.close();
  dlg.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>openDialog(()=>authView(b.dataset.v)));
  const g = dlg.querySelector("#dGoogle");
  const oauthGo = provider => async ()=>{
    const native = window.BN_NATIVE;
    const {data, error} = await sb.auth.signInWithOAuth({provider, options:{redirectTo: native ? native.redirect : location.origin+location.pathname, skipBrowserRedirect: !!native}});
    if(error) return msg(friendlyError(error),"error");
    if(native && data && data.url) native.openAuth(data.url);
  };
  if(g) g.onclick = oauthGo("google");
  const ap = dlg.querySelector("#dApple"); if(ap) ap.onclick = oauthGo("apple");
  form.onsubmit = async (e)=>{
    e.preventDefault();
    if(view==="signup" && !form.agree.checked){ msg(t("aMustAgree"),"error"); form.agree.focus(); return; }
    if(!form.checkValidity()){ form.reportValidity(); return; }
    const f = Object.fromEntries(new FormData(form));
    const captchaToken = CFG.turnstileSiteKey && view!=="newpass" ? (f["cf-turnstile-response"] || "") : undefined;
    if(CFG.turnstileSiteKey && view!=="newpass" && !captchaToken){ msg(t("captchaErr"),"error"); return; }
    busy(form,true); msg("");
    try{
      if(view==="signin"){ const {error} = await sb.auth.signInWithPassword({email:f.email, password:f.password, options:{captchaToken}}); if(error) throw error; dlg.close(); }
      if(view==="signup"){
        const {data,error} = await sb.auth.signUp({email:f.email, password:f.password, options:{captchaToken, emailRedirectTo:siteBase(), data:{display_name:f.name||"", language:lang, terms_version:TERMS_VERSION, marketing_opt_in:!!f.marketing}}});
        track("signup");
        if(error) throw error;
        if(data.session){ dlg.close(); } else { msg(t("aCheckEmail"),"ok"); }
      }
      if(view==="reset"){ const {error} = await sb.auth.resetPasswordForEmail(f.email,{captchaToken, redirectTo:siteBase()}); if(error) throw error; msg(t("aResetSent"),"ok"); }
      if(view==="newpass"){ const {error} = await sb.auth.updateUser({password:f.password}); if(error) throw error; msg(t("aPwUpdated"),"ok"); setTimeout(()=>dlg.close(),1200); }
    }catch(err){ msg(friendlyError(err),"error"); if(window.turnstile) try{ turnstile.reset(); }catch(e){} }
    finally{ busy(form,false); }
  };
}
/* Cloudflare Turnstile captcha (only when config.js has turnstileSiteKey; also enable it in Supabase → Auth → Bot protection) */
let tsLoading = null;
function mountCaptcha(){
  const el = dlg.querySelector("#dCaptcha"); if(!el) return;
  const render = ()=>{ try{ turnstile.render(el, {sitekey:CFG.turnstileSiteKey, language:lang==="ar"?"ar":lang, theme:document.documentElement.dataset.theme==="dark"?"dark":"auto"}); }catch(e){ console.warn("BeeNews: captcha", e); } };
  if(window.turnstile) return render();
  if(!tsLoading) tsLoading = new Promise((ok, bad)=>{ const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  tsLoading.then(render, ()=>console.warn("BeeNews: captcha script blocked"));
}

/* ----- consent prompt (Google/Apple sign-ins, or after the terms change) ----- */
function consentView(){
  dlg.innerHTML = `<form class="dbody" novalidate><div class="dhead"><h2>${esc(t("cnTitle"))}</h2></div>
    <p class="dmsg" hidden role="status"></p><p class="dnote">${esc(t("cnBody"))}</p>
    <label class="consent"><input type="checkbox" name="agree" value="1" required><span>${legalLinks("aAgree")}</span></label>
    <label class="consent"><input type="checkbox" name="marketing" value="1"><span>${esc(t("aMarketing"))}</span></label>
    <div class="dactions"><button class="primary" type="submit">${esc(t("cnAccept"))}</button><button type="button" id="dOut">${esc(t("cnLater"))}</button></div></form>`;
  const form = dlg.querySelector("form");
  dlg.querySelector("#dOut").onclick = async ()=>{ needsConsent = false; await sb.auth.signOut(); dlg.close(); };
  form.onsubmit = async e=>{
    e.preventDefault();
    if(!form.agree.checked){ msg(t("aMustAgree"),"error"); return; }
    busy(form,true);
    const {error} = await sb.rpc("accept_terms",{version:TERMS_VERSION, marketing:form.marketing.checked});
    busy(form,false);
    if(error){ msg(friendlyError(error),"error"); return; }
    needsConsent = false; dlg.close();
  };
}
dlg.addEventListener("cancel", e=>{ if(needsConsent) e.preventDefault(); });
function promptConsentIfNeeded(){ if(needsConsent && session) openDialog(consentView); }

/* ----- account dialog ----- */
function accountView(){
  const email = session && session.user ? session.user.email : "";
  dlg.innerHTML = `<div class="dbody"><div class="dhead"><h2>${esc(t("account"))}</h2><button type="button" class="x" aria-label="${esc(t("close"))}">×</button></div>
    <p class="dmsg" hidden role="status"></p>
    <p class="dnote">${esc(t("mSignedInAs"))} <b>${esc(profileName||email)}</b><br><span class="mono">${esc(email)}</span></p>
    <div class="dactions"><button class="primary" type="button" id="dCust">${esc(t("customise"))}</button><button type="button" id="dOut">${esc(t("mSignOut"))}</button></div>
    ${CFG.vapidPublicKey ? `<div class="alerts"><h3>${esc(t("alertsH"))}</h3><p class="dnote">${esc(t("alertsNote"))}</p><button type="button" id="dAlerts" class="cta-ghost sm"></button></div>` : ""}
    <div class="danger"><button type="button" class="link dangerlink" id="dDel">${esc(t("mDelete"))}</button>
      <div id="dDelConfirm" hidden><p>${esc(t("mDeleteQ"))}</p><button type="button" class="dangerbtn" id="dDelYes">${esc(t("mDeleteYes"))}</button> <button type="button" id="dDelNo">${esc(t("cCancel"))}</button></div></div></div>`;
  dlg.querySelector(".x").onclick = ()=>dlg.close();
  dlg.querySelector("#dCust").onclick = ()=>openDialog(customiseView);
  dlg.querySelector("#dOut").onclick = async ()=>{ await sb.auth.signOut(); dlg.close(); };
  if(dlg.querySelector("#dAlerts")) setupAlerts(dlg.querySelector("#dAlerts"));
  dlg.querySelector("#dDel").onclick = ()=>{ dlg.querySelector("#dDelConfirm").hidden=false; };
  dlg.querySelector("#dDelNo").onclick = ()=>{ dlg.querySelector("#dDelConfirm").hidden=true; };
  dlg.querySelector("#dDelYes").onclick = async ()=>{
    const {error} = await sb.rpc("delete_my_account");
    if(error){ msg(friendlyError(error),"error"); return; }
    await sb.auth.signOut(); prefs = Object.assign({},DEFAULTS); saveLocal(prefs); applyPrefs();
    msg(t("mDeleted"),"ok"); setTimeout(()=>dlg.close(),1500);
  };
}

/* ----- breaking-news alerts (web push) ----- */
const b64 = s => { const p = "=".repeat((4 - s.length % 4) % 4); const raw = atob((s + p).replace(/-/g,"+").replace(/_/g,"/")); return Uint8Array.from(raw, c=>c.charCodeAt(0)); };
async function setupAlerts(btn){
  const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if(!ok){ btn.textContent = t("alertsNo"); btn.disabled = true; return; }
  const reg = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register("sw.js");
  let sub = await reg.pushManager.getSubscription();
  const label = ()=>{ btn.innerHTML = `<i class="fa-solid ${sub?"fa-bell-slash":"fa-bell"}" aria-hidden="true"></i> ${esc(t(sub?"alertsOff":"alertsOn"))}`; };
  label();
  btn.onclick = async ()=>{
    btn.disabled = true;
    try{
      if(sub){
        await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe(); sub = null; msg(t("alertsOffMsg"),"ok");
      } else {
        if(await Notification.requestPermission() !== "granted"){ msg(t("alertsDenied"),"error"); return; }
        sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64(CFG.vapidPublicKey)});
        const j = sub.toJSON();
        const {error} = await sb.from("push_subscriptions").upsert({endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth,
          user_id:session.user.id, sections:prefs.sections, lang});
        if(error) throw error;
        msg(t("alertsOnMsg"),"ok"); track("install","push");
      }
    }catch(e){ msg(friendlyError(e),"error"); }
    finally{ btn.disabled = false; label(); }
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
    ${sb ? `<div class="askbox"><label for="askIn"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ${esc(t("askH"))}</label>
      <div class="askrow"><input id="askIn" maxlength="500" placeholder="${esc(t("askPh"))}"><button type="button" class="cta-amber sm" id="askGo">${esc(t("askGo"))}</button></div>
      <p class="asknote">${esc(t("askNote"))}</p><div id="askOut" role="status" aria-live="polite"></div></div>` : ""}
    <fieldset><legend>${esc(t("cSections"))}</legend><div class="opts">${sec}</div></fieldset>
    <fieldset><legend>${esc(t("cCountries"))}</legend><div class="opts">${ctr}</div></fieldset>
    <div class="row2"><label>${esc(t("cLang"))}<select name="language">${langs}</select></label>
      <label>${esc(t("cSign"))}<select name="horoscope_sign">${signs}</select></label></div>
    <fieldset><legend>${esc(t("cCur"))}</legend><div class="opts">${cur}</div></fieldset>
    <div class="dactions"><button class="primary" type="submit">${esc(t("cSave"))}</button><button type="button" id="dCancel">${esc(t("cCancel"))}</button></div></form>`;
  const form = dlg.querySelector("form");
  dlg.querySelector(".x").onclick = dlg.querySelector("#dCancel").onclick = ()=>dlg.close();
  const askGo = dlg.querySelector("#askGo");
  if(askGo){
    const askIn = dlg.querySelector("#askIn"), out = dlg.querySelector("#askOut");
    askIn.onkeydown = e=>{ if(e.key==="Enter"){ e.preventDefault(); askGo.click(); } };
    askGo.onclick = async ()=>{
      const q = askIn.value.trim(); if(!q) return;
      if(!session){ out.innerHTML = `<p>${esc(t("askSignIn"))}</p>`; return; }
      askGo.disabled = true; askGo.textContent = t("askBusy"); out.innerHTML = "";
      try{
        const {data, error} = await sb.functions.invoke("ask", {body:{message:q, lang, currencyCodes:FXR.map(f=>f.c)}});
        if(error){ let m = t("askOff"); try{ const b = await error.context.json(); if(b && b.error) m = b.error; }catch(_){} throw new Error(m); }
        let html = `<p>${esc(data.reply||"")}</p>`;
        if(data.prefs){
          const set = (name, vals)=>{ if(!Array.isArray(vals)) return; form.querySelectorAll(`input[name="${name}"]`).forEach(i=>{ i.checked = vals.includes(i.value); }); };
          set("sections", data.prefs.sections); set("countries", data.prefs.countries); set("currencies", data.prefs.currencies);
          if(data.prefs.language) form.language.value = data.prefs.language;
          if(data.prefs.horoscope_sign) form.horoscope_sign.value = data.prefs.horoscope_sign;
          html += `<p class="asknote">${esc(t("askApplied"))}</p>`;
        }
        if(data.play && data.play.length && window.BeeUI) html += `<button type="button" class="cta-ghost sm" id="askPlay"><i class="fa-solid fa-headphones" aria-hidden="true"></i> ${esc(t("askPlay"))} (${data.play.length})</button>`;
        out.innerHTML = html;
        const pb = out.querySelector("#askPlay"); if(pb) pb.onclick = ()=>{ dlg.close(); BeeUI.playIds(data.play); };
      }catch(e){ out.innerHTML = `<p class="err">${esc(e.message||t("askOff"))}</p>`; }
      finally{ askGo.disabled = false; askGo.textContent = t("askGo"); }
    };
  }
  form.onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const next = {language: fd.get("language")||null, sections: fd.getAll("sections"), countries: fd.getAll("countries"),
                  horoscope_sign: fd.get("horoscope_sign")||null, currencies: fd.getAll("currencies")};
    const saveBtn = form.querySelector("button.primary");
    busy(form,true); msg(""); saveBtn.textContent = t("cSaving");
    try{
      if(sb && session){
        const {error} = await withTimeout(sb.from("user_preferences").upsert(Object.assign({user_id:session.user.id}, next)), 15000);
        if(error) throw error;
        sb.from("push_subscriptions").update({sections:next.sections, lang:next.language||lang}).eq("user_id", session.user.id).then(()=>{});
      }
      prefs = Object.assign({}, DEFAULTS, next); saveLocal(prefs);
      dlg.close();
      applyPrefs();
      showForYou();
      flashForYou();
      toast(t("cUpdated"), (sb && session) ? t("cUpdatedSub") : t("cUpdatedLocal"));
    }catch(err){ msg(friendlyError(err),"error"); }
    finally{ busy(form,false); saveBtn.textContent = t("cSave"); }
  };
}

window.BN = {
  signedIn: ()=>!!session,
  openSignUp: ()=>openDialog(()=>authView(sb?"signup":"signin")),
  openCustomise: ()=>openDialog(customiseView),
  toast: (a,b)=>toast(a,b),
  refresh: ()=>{ renderForYou(); },
  saveRemote, track, sb
};
acctBtn.onclick = ()=> openDialog(session ? accountView : ()=>authView("signin"));
custBtn.onclick = ()=> openDialog(customiseView);

/* ---------- For You homepage ---------- */
function renderForYou(){
  if(state.sec!=="All"){ fy.hidden = true; return; }
  fy.hidden = false;
  const hasPicks = prefs.sections.length || prefs.countries.length;
  const hasAny = hasPicks || SAVED.size || prefs.horoscope_sign || (prefs.currencies.length && prefs.currencies.join()!==DEFAULTS.currencies.join());
  if(!hasAny){
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
        ${picks.length?`<button class="cta-amber sm" type="button" data-play="fy"><i class="fa-solid fa-headphones" aria-hidden="true"></i> ${esc(t("listen"))}</button>`:""}<button class="cta-ghost sm" type="button" data-act="cust">${esc(t("fyEdit"))}</button></div>
      <div class="fy-body"><div class="fy-grid">${!hasPicks?`<p class="fy-none">${esc(t("fyPickMore"))} <button type="button" class="link-inline" data-act="cust">${esc(t("customise"))}</button></p>`:picks.length?picks.map(card).join(""):`<p class="fy-none">${esc(t("fyNone"))}</p>`}</div>
      <aside class="fy-side">${savedBox()}${cur?`<div class="fy-box sc-markets"><h3>${esc(t("myMarkets"))}</h3><ul>${cur}</ul></div>`:""}
        ${sg?`<div class="fy-box sc-horo"><h3>${esc(t("mySign"))} · ${esc(t(sg[0]))} ${sg[1]}</h3><p>${esc((HORO[lang]||HORO.en)[sg[0]]||"")}</p></div>`:""}</aside></div>`;
  }
  fy.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>openDialog(b.dataset.act==="cust"?customiseView:()=>authView("signin")));
}

function flashForYou(){
  fy.classList.remove("flash"); void fy.offsetWidth; fy.classList.add("flash");
}
function showForYou(){
  if(state.sec!=="All") selectTab("All");
  const y = fy.getBoundingClientRect().top + window.scrollY - $("rail").offsetHeight - 12;
  window.scrollTo({top:Math.max(0,y), behavior:(typeof REDUCE!=="undefined" && REDUCE)?"auto":"smooth"});
}
function savedBox(){
  const items = S.filter(st=>SAVED.has(st.id)).slice(0,5);
  if(!items.length) return "";
  return `<div class="fy-box sc-all"><h3><i class="fa-solid fa-bookmark" aria-hidden="true"></i> ${esc(t("savedStories"))}</h3><ul class="fy-saved">${items.map(st=>`<li><a href="/story/${encodeURIComponent(st.id)}">${esc(SH(st))}</a></li>`).join("")}</ul></div>`;
}
function refreshChrome(){
  const nm = session ? (profileName || (session.user.email||"").split("@")[0] || t("account")) : t("signIn");
  acctBtn.innerHTML = `<i class="fa-solid ${session?"fa-circle-user":"fa-right-to-bracket"}" aria-hidden="true"></i><span>${esc(nm)}</span>`;
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
  const settled = await Promise.allSettled([
    sb.from("stories").select("*").eq("status","published").order("published_at",{ascending:false}).limit(300),
    sb.from("events").select("*").eq("status","published"),
    sb.from("fx_rates").select("*").order("sort"),
    sb.from("market_quotes").select("*").order("sort"),
    sb.from("horoscopes").select("*").eq("day", today)
  ]);
  const names = ["stories","events","fx_rates","market_quotes","horoscopes"];
  const [st, ev, fxr, mq, hr] = settled.map((r,i)=>{
    const v = r.status==="fulfilled" ? r.value : {data:null, error:r.reason};
    if(v.error){ console.warn("BeeNews: could not load "+names[i]+" from Supabase:", v.error.message||v.error); return {data:[]}; }
    return {data:v.data||[]};
  });
  window.BEENEWS_STATUS = {connected:true, stories:st.data.length, events:ev.data.length};
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
    sb.from("profiles").select("*").eq("id", uid).maybeSingle()
  ]);
  if(pr.data){
    profileName = pr.data.display_name || "";
    // only enforce once the launch migration has added the consent columns
    needsConsent = ("terms_version" in pr.data) && pr.data.terms_version !== TERMS_VERSION;
  }
  syncSaved().catch(e=>console.warn("BeeNews: saved stories sync:", e.message||e));
  if(p.data){
    prefs = Object.assign({}, DEFAULTS, {language:p.data.language, sections:p.data.sections||[], countries:p.data.countries||[],
      horoscope_sign:p.data.horoscope_sign, currencies:p.data.currencies||DEFAULTS.currencies});
    saveLocal(prefs);
  }
}

/* ---------- saved stories and reading history, synced to the account ---------- */
async function syncSaved(){
  if(!sb || !session) return;
  const uid = session.user.id;
  const {data, error} = await sb.from("saved_stories").select("story_id").eq("user_id", uid);
  if(error) return;                              // table not created yet: keep device-only saving
  const remote = new Set(data.map(r=>r.story_id));
  const known = new Set(S.map(x=>x.id));
  const up = [...SAVED].filter(id=>!remote.has(id) && known.has(id)).map(id=>({user_id:uid, story_id:id}));
  if(up.length) await sb.from("saved_stories").upsert(up, {onConflict:"user_id,story_id", ignoreDuplicates:true});
  remote.forEach(id=>SAVED.add(id));
  try{ localStorage.setItem("beenews-saved", JSON.stringify([...SAVED])); }catch(e){}
  renderForYou();
}
function saveRemote(id, on){
  if(!sb || !session) return;
  const q = on ? sb.from("saved_stories").upsert({user_id:session.user.id, story_id:id}, {onConflict:"user_id,story_id", ignoreDuplicates:true})
               : sb.from("saved_stories").delete().eq("user_id", session.user.id).eq("story_id", id);
  q.then(r=>{ if(r.error) console.warn("BeeNews: saved sync:", r.error.message); });
  if(on) track("save");
}

/* ---------- privacy-respecting analytics and crash reports ---------- */
// Only daily totals per event are stored (no account ID, no IP). Turned off when config.analytics === false.
const tracked = new Set();
function track(name, key){
  if(!sb || CFG.analytics === false) return;
  const k = name+"|"+(key||"");
  if(name!=="listen" && tracked.has(k)) return;   // count each thing once per page view
  tracked.add(k);
  sb.rpc("track",{event_name:name, event_key:String(key||"").slice(0,80)}).then(()=>{},()=>{});
}
let errCount = 0;
function reportError(message, source){
  if(!sb || errCount++ >= 5) return;
  sb.rpc("log_client_error",{message:String(message||"").slice(0,500), source:String(source||"").slice(0,200),
    page:location.pathname, agent:navigator.userAgent.slice(0,200)}).then(()=>{},()=>{});
}
window.addEventListener("error", e=>reportError(e.message, (e.filename||"")+":"+(e.lineno||"")));
window.addEventListener("unhandledrejection", e=>reportError(e.reason && (e.reason.message||e.reason), "promise"));

/* ---------- start ---------- */
const log = (...a)=>console.info("BeeNews:", ...a);
function safe(label, fn){ try{ return fn(); }catch(e){ console.error("BeeNews: "+label+" failed:", e); } }
async function start(){
  // 1. Show the saved homepage from this device straight away, before any network request.
  safe("apply saved preferences", ()=>{ refreshChrome(); applyPrefs(); });
  if(!sb){ window.BEENEWS_STATUS = {connected:false, reason:"demo mode: config.js has no Supabase URL/key"}; log("demo mode (no Supabase config)"); return; }
  // 2. Restore the sign-in session saved in this browser.
  try{
    const {data, error} = await withTimeout(sb.auth.getSession(), 10000);
    if(error) console.warn("BeeNews: session restore error:", error.message);
    session = data ? data.session : null;
    log(session ? "signed in as "+session.user.email : "not signed in (no saved session in this browser)");
  }catch(e){ console.error("BeeNews: session restore failed:", e.message||e); }
  safe("update header", refreshChrome);
  // 3. Load the latest edition and the account's saved homepage in parallel.
  const tasks = [loadContent().then(()=>log("content loaded:", S.length, "stories,", EV.length, "events"))
                              .catch(e=>console.warn("BeeNews: content load failed:", e.message||e))];
  if(session) tasks.push(loadRemotePrefs().then(()=>log("saved homepage loaded from account"))
                              .catch(e=>console.warn("BeeNews: could not load saved homepage:", e.message||e)));
  await Promise.all(tasks);
  safe("render edition", buildChrome);
  safe("apply preferences", applyPrefs);
  promptConsentIfNeeded();
  track("page_view", location.pathname==="/"?"home":location.pathname);
  // 4. React to sign-in and sign-out from now on. Supabase holds an auth lock while this callback runs,
  //    so the callback only records the event and defers any Supabase calls.
  let lastUid = session ? session.user.id : null;
  sb.auth.onAuthStateChange((event, s)=>{
    session = s;
    setTimeout(async ()=>{
      log("auth event:", event);
      if(event==="PASSWORD_RECOVERY"){ openDialog(()=>authView("newpass")); return; }
      if(event==="SIGNED_IN" && s && s.user.id!==lastUid){ lastUid = s.user.id; try{ await loadRemotePrefs(); }catch(e){ console.warn(e); } safe("apply preferences", applyPrefs); promptConsentIfNeeded(); }
      if(event==="SIGNED_OUT"){ lastUid = null; profileName=""; needsConsent = false; safe("show page", showView); }
      safe("update header", refreshChrome);
    }, 0);
  });
}
start().catch(e=>console.error("BeeNews: startup failed:", e));

/* installable app */
if("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
})();
