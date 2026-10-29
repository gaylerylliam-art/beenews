# -*- coding: utf-8 -*-
# Source text for BeeNews legal pages (English and Arabic). Build with: python3 tools/build_pages.py
# Placeholders the owner must fill are wrapped in [[...]] and rendered highlighted.
UPDATED = {"en": "Draft dated 29 October 2026", "ar": "مسودة بتاريخ 29 أكتوبر 2026"}

PRIVACY = {
"en": """
<h1>Privacy policy</h1>
<p class="updated">{updated}</p>
<p>This policy explains what personal data BeeNews collects, why, and the choices you have. BeeNews is operated by [[Company legal name]], [[trade licence number and issuing authority]], [[registered address]], United Arab Emirates ("BeeNews", "we"). We follow the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021).</p>
<ul class="toc"><li><a href="#collect">What we collect</a></li><li><a href="#use">How we use it</a></li><li><a href="#share">Who we share it with</a></li><li><a href="#keep">How long we keep it</a></li><li><a href="#rights">Your rights</a></li><li><a href="#contact">Contact</a></li></ul>
<h2 id="collect">1. What we collect</h2>
<table><tr><th>Data</th><th>When</th><th>Why</th></tr>
<tr><td>Email address, name you choose, encrypted password</td><td>You create an account</td><td>To run your account and send account emails (confirmation, password reset)</td></tr>
<tr><td>Google or Apple account identifier and email</td><td>You sign in with Google or Apple</td><td>To sign you in</td></tr>
<tr><td>Your consent to these terms, and whether you want the daily briefing by email</td><td>Sign-up</td><td>To record your consent</td></tr>
<tr><td>Homepage choices: sections, countries, language, star sign, currencies</td><td>You use Customise</td><td>To show your For You homepage on every device</td></tr>
<tr><td>Saved stories and the last 200 stories you opened</td><td>You are signed in</td><td>To sync your saved stories and show recently read stories</td></tr>
<tr><td>Error reports and contact messages, and an email address if you give one</td><td>You report an error or contact us</td><td>To check and correct stories and reply to you</td></tr>
<tr><td>Breaking-news alert subscription (a technical address for your browser or phone, and the sections you chose)</td><td>You turn on alerts</td><td>To send the alerts you asked for</td></tr>
<tr><td>What you type into Ask BeeNews</td><td>You use the assistant</td><td>To suggest homepage settings</td></tr>
<tr><td>Daily totals of page views, story opens, listens and similar events, with no account ID and no IP address</td><td>You use the app</td><td>To understand which features are used</td></tr>
<tr><td>Short technical error messages (the error text, the page, the browser type)</td><td>The app hits an error</td><td>To find and fix bugs</td></tr></table>
<p><b>Stored only on your device:</b> your language, light or dark mode, chosen emirate for weather and prayer times, and (when you are not signed in) your homepage choices and saved stories. You can clear them in your browser settings.</p>
<p><b>Not collected:</b> we do not use advertising trackers, we do not sell personal data, and we do not use your device location. Weather is requested for the emirate you choose, and prayer times are calculated on your device. Read-aloud uses your device's own voice engine.</p>
<h2 id="use">2. How we use it and on what basis</h2>
<p>We use your data to provide the services you ask for (your account, homepage, saved stories, alerts, replies to your reports), with your consent where the law requires it, and to keep BeeNews secure and working. You can withdraw consent at any time, for example by turning off alerts or deleting your account. Withdrawing consent does not affect processing that already took place.</p>
<h2 id="share">3. Who we share it with</h2>
<p>We use these service providers, who process data on our behalf under contract:</p>
<ul><li><b>Supabase</b>: database and sign-in. Data is stored in [[Supabase project region, e.g. Frankfurt or Mumbai]].</li>
<li><b>Netlify</b>: hosting the website.</li>
<li><b>Google and Apple</b>: only if you choose to sign in with them.</li>
<li><b>Anthropic</b>: processes your Ask BeeNews message to generate suggestions; not used for advertising.</li>
<li><b>Open-Meteo</b>: receives the coordinates of the emirate you choose (not your location) to return the weather.</li>
<li><b>Email provider</b>: [[name of email sending provider]] for account emails.</li></ul>
<p>Some of these providers store data outside the UAE. Where that happens we rely on the safeguards permitted by UAE law. We may disclose data if required by UAE law or a competent authority.</p>
<h2 id="keep">4. How long we keep it</h2>
<ul><li>Account, preferences and saved stories: until you delete your account.</li>
<li>Reading history: the latest 200 stories only.</li>
<li>Error reports and contact messages: up to 24 months.</li>
<li>Technical error logs: up to 90 days.</li>
<li>Usage totals: kept, as they contain no personal data.</li></ul>
<h2 id="rights">5. Your rights</h2>
<p>You can ask to access, correct, delete, restrict or move your personal data, object to processing, and withdraw consent. You can delete your account yourself in <b>Account → Delete account</b>; this removes your profile, preferences, saved stories and history. For any other request, email <span class="ph">[[privacy@your-domain]]</span>. We aim to reply within 30 days. You may also complain to the UAE Data Office.</p>
<h2>6. Children</h2>
<p>BeeNews accounts are intended for people aged [[18, or the minimum age your lawyer advises]] and over.</p>
<h2>7. Security</h2>
<p>Data is encrypted in transit, passwords are stored as one-way hashes, and database access rules allow each reader to reach only their own data. No system is perfectly secure; if a breach affects you, we will tell you and the authorities as the law requires.</p>
<h2>8. Changes</h2>
<p>We will post any changes on this page and, for important changes, tell signed-in readers in the app.</p>
<h2 id="contact">9. Contact</h2>
<p>[[Company legal name]], [[registered address]]. Email: <span class="ph">[[privacy@your-domain]]</span>.</p>
""",
"ar": """
<h1>سياسة الخصوصية</h1>
<p class="updated">{updated}</p>
<p>توضح هذه السياسة البيانات الشخصية التي يجمعها بي نيوز، وسبب جمعها، والخيارات المتاحة لك. يدير بي نيوز [[الاسم القانوني للشركة]]، [[رقم الرخصة التجارية وجهة الإصدار]]، [[العنوان المسجل]]، الإمارات العربية المتحدة ("بي نيوز" أو "نحن"). نلتزم بالمرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية.</p>
<h2>1. البيانات التي نجمعها</h2>
<table><tr><th>البيانات</th><th>متى</th><th>لماذا</th></tr>
<tr><td>البريد الإلكتروني، والاسم الذي تختاره، وكلمة المرور مشفّرة</td><td>عند إنشاء حساب</td><td>لتشغيل حسابك وإرسال رسائل الحساب (التأكيد، إعادة تعيين كلمة المرور)</td></tr>
<tr><td>معرّف حساب Google أو Apple والبريد الإلكتروني</td><td>عند تسجيل الدخول عبر Google أو Apple</td><td>لتسجيل دخولك</td></tr>
<tr><td>موافقتك على هذه الشروط، ورغبتك في تلقي الموجز اليومي بالبريد</td><td>عند التسجيل</td><td>لتوثيق موافقتك</td></tr>
<tr><td>اختيارات الصفحة الرئيسية: الأقسام، الدول، اللغة، البرج، العملات</td><td>عند استخدام "تخصيص"</td><td>لعرض صفحتك على كل أجهزتك</td></tr>
<tr><td>الأخبار المحفوظة وآخر 200 خبر فتحتها</td><td>عندما تكون مسجلاً الدخول</td><td>لمزامنة المحفوظات وعرض ما قرأته مؤخراً</td></tr>
<tr><td>بلاغات الأخطاء ورسائل التواصل، وبريدك إن قدّمته</td><td>عند الإبلاغ عن خطأ أو التواصل معنا</td><td>لمراجعة الأخبار وتصحيحها والرد عليك</td></tr>
<tr><td>اشتراك تنبيهات الأخبار العاجلة (عنوان تقني لمتصفحك أو هاتفك والأقسام المختارة)</td><td>عند تفعيل التنبيهات</td><td>لإرسال التنبيهات التي طلبتها</td></tr>
<tr><td>ما تكتبه في "اسأل بي نيوز"</td><td>عند استخدام المساعد</td><td>لاقتراح إعدادات الصفحة الرئيسية</td></tr>
<tr><td>مجاميع يومية لمشاهدات الصفحات وفتح الأخبار والاستماع ونحوها، دون معرّف حساب ودون عنوان IP</td><td>عند استخدام التطبيق</td><td>لمعرفة الميزات المستخدمة</td></tr>
<tr><td>رسائل أخطاء تقنية قصيرة (نص الخطأ، الصفحة، نوع المتصفح)</td><td>عند حدوث خطأ</td><td>لاكتشاف الأعطال وإصلاحها</td></tr></table>
<p><b>تُحفظ على جهازك فقط:</b> لغتك، والوضع الفاتح أو الداكن، والإمارة المختارة للطقس ومواقيت الصلاة، و(عند عدم تسجيل الدخول) اختيارات الصفحة والأخبار المحفوظة. يمكنك مسحها من إعدادات المتصفح.</p>
<p><b>ما لا نجمعه:</b> لا نستخدم أدوات تتبع إعلانية، ولا نبيع البيانات الشخصية، ولا نستخدم موقع جهازك. يُطلب الطقس للإمارة التي تختارها، وتُحسب مواقيت الصلاة على جهازك، وتستخدم القراءة الصوتية محرك الصوت في جهازك.</p>
<h2>2. كيف نستخدمها وعلى أي أساس</h2>
<p>نستخدم بياناتك لتقديم الخدمات التي تطلبها (حسابك، صفحتك، المحفوظات، التنبيهات، الرد على بلاغاتك)، وبموافقتك حيث يشترط القانون ذلك، وللحفاظ على أمان بي نيوز وعمله. يمكنك سحب موافقتك في أي وقت، مثلاً بإيقاف التنبيهات أو حذف حسابك، دون أن يؤثر ذلك على المعالجة السابقة.</p>
<h2>3. مع من نشاركها</h2>
<ul><li><b>Supabase</b>: قاعدة البيانات وتسجيل الدخول. تُخزَّن البيانات في [[منطقة مشروع Supabase]].</li>
<li><b>Netlify</b>: استضافة الموقع.</li>
<li><b>Google وApple</b>: فقط إذا اخترت تسجيل الدخول عبرهما.</li>
<li><b>Anthropic</b>: تعالج رسالتك في "اسأل بي نيوز" لتوليد الاقتراحات، ولا تُستخدم للإعلانات.</li>
<li><b>Open-Meteo</b>: تتلقى إحداثيات الإمارة التي تختارها (لا موقعك) لإرجاع الطقس.</li>
<li><b>مزوّد البريد</b>: [[اسم مزوّد إرسال البريد]] لرسائل الحساب.</li></ul>
<p>يخزّن بعض هؤلاء المزوّدين البيانات خارج الدولة، ونعتمد في ذلك على الضمانات التي يجيزها قانون الدولة. وقد نفصح عن البيانات إذا اقتضى القانون أو جهة مختصة ذلك.</p>
<h2>4. مدة الاحتفاظ</h2>
<ul><li>الحساب والتفضيلات والمحفوظات: حتى تحذف حسابك.</li><li>سجل القراءة: آخر 200 خبر فقط.</li><li>بلاغات الأخطاء ورسائل التواصل: حتى 24 شهراً.</li><li>سجلات الأخطاء التقنية: حتى 90 يوماً.</li><li>مجاميع الاستخدام: تُحفظ لأنها لا تتضمن بيانات شخصية.</li></ul>
<h2>5. حقوقك</h2>
<p>يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها أو تقييد معالجتها أو نقلها، والاعتراض على المعالجة، وسحب موافقتك. يمكنك حذف حسابك بنفسك من <b>الحساب ← حذف الحساب</b>. لأي طلب آخر راسلنا على <span class="ph">[[privacy@نطاقك]]</span>، ونسعى للرد خلال 30 يوماً. ويمكنك تقديم شكوى إلى مكتب البيانات في الإمارات.</p>
<h2>6. الأطفال</h2><p>حسابات بي نيوز مخصّصة لمن بلغوا [[18 عاماً أو الحد الأدنى الذي ينصح به المحامي]] فما فوق.</p>
<h2>7. الأمان</h2><p>تُشفَّر البيانات أثناء النقل، وتُحفظ كلمات المرور بتجزئة أحادية الاتجاه، وتسمح قواعد الوصول لكل قارئ ببياناته فقط. لا يوجد نظام آمن تماماً؛ وإذا تأثرت بياناتك باختراق فسنبلغك والجهات المختصة وفق القانون.</p>
<h2>8. التعديلات</h2><p>ننشر أي تعديلات على هذه الصفحة، ونبلغ القراء المسجلين بالتعديلات المهمة داخل التطبيق.</p>
<h2>9. التواصل</h2><p>[[الاسم القانوني للشركة]]، [[العنوان المسجل]]. البريد: <span class="ph">[[privacy@نطاقك]]</span>.</p>
"""}

TERMS = {
"en": """
<h1>Terms of use</h1>
<p class="updated">{updated}</p>
<p>These terms apply to the BeeNews website and apps, operated by [[Company legal name]] ("BeeNews", "we"). By using BeeNews or creating an account you agree to them.</p>
<h2>1. What BeeNews is</h2>
<p>BeeNews publishes short, original summaries of news from approved sources, with a link to each original report, plus UAE events, markets snapshots, weather, prayer times and horoscopes. Full articles and photographs remain with their publishers.</p>
<h2>2. Your account</h2>
<ul><li>Keep your password private; you are responsible for activity on your account.</li><li>Give accurate details and be at least [[18]] years old.</li><li>You can delete your account at any time in Account → Delete account.</li></ul>
<h2>3. Acceptable use</h2>
<p>Do not misuse BeeNews: no attempts to break or overload it, no automated scraping, no false or abusive error reports, and nothing that breaks UAE law, including the media content standards and the law on rumours and cybercrime.</p>
<h2>4. Accuracy and our labels</h2>
<p>We check stories using the process in our <a href="/editorial.html">editorial policy</a> and label each one (Official announcement, Corroborated, Developing, Single source). News changes quickly and summaries are short, so always read the original report before relying on a story. Translations into Arabic, French and German are produced with AI help and reviewed by our editors; the English version prevails if they differ.</p>
<h2>5. Markets, weather, prayer times and horoscopes</h2>
<ul><li><b>Markets</b> show a dated snapshot, not live prices, and are not financial advice.</li>
<li><b>Weather</b> comes from Open-Meteo and may differ from official forecasts.</li>
<li><b>Prayer times</b> are calculated with the UAE method and may differ by a minute or two from the official timetable; check your local mosque or Awqaf.</li>
<li><b>Horoscopes</b> are written for entertainment only.</li></ul>
<h2>6. Intellectual property</h2>
<p>BeeNews summaries, design, logo and software belong to [[Company legal name]]. You may share links to our pages. Linked articles, names and marks belong to their owners.</p>
<h2>7. Links to other sites</h2>
<p>We link to publishers and organisers. We are not responsible for their content or practices.</p>
<h2>8. Liability</h2>
<p>To the extent permitted by UAE law, BeeNews is provided "as is", and we are not liable for indirect losses or for decisions made using content from BeeNews. Nothing in these terms limits liability that cannot be limited by law.</p>
<h2>9. Changes and ending the service</h2>
<p>We may update these terms and will post changes here. We may suspend accounts that break these terms.</p>
<h2>10. Law and disputes</h2>
<p>These terms are governed by the laws of the United Arab Emirates [[and the Emirate of Dubai]]; the courts of [[Dubai]] have jurisdiction.</p>
<h2>11. Contact</h2>
<p>[[Company legal name]], [[registered address]]. Email: <span class="ph">[[hello@your-domain]]</span>.</p>
""",
"ar": """
<h1>شروط الاستخدام</h1>
<p class="updated">{updated}</p>
<p>تسري هذه الشروط على موقع بي نيوز وتطبيقاته، الذي يديره [[الاسم القانوني للشركة]] ("بي نيوز" أو "نحن"). باستخدامك بي نيوز أو إنشاء حساب فإنك توافق عليها.</p>
<h2>1. ما هو بي نيوز</h2><p>ينشر بي نيوز ملخصات قصيرة وأصلية لأخبار من مصادر معتمدة مع رابط لكل تقرير أصلي، إضافة إلى فعاليات الإمارات ولقطات الأسواق والطقس ومواقيت الصلاة والأبراج. تبقى المقالات الكاملة والصور ملكاً لناشريها.</p>
<h2>2. حسابك</h2><ul><li>حافظ على سرية كلمة المرور؛ فأنت مسؤول عن النشاط في حسابك.</li><li>قدّم بيانات صحيحة، وأن يكون عمرك [[18]] عاماً على الأقل.</li><li>يمكنك حذف حسابك في أي وقت من الحساب ← حذف الحساب.</li></ul>
<h2>3. الاستخدام المقبول</h2><p>لا تسئ استخدام بي نيوز: لا محاولات لتعطيله أو إثقاله، ولا جمع آلي للمحتوى، ولا بلاغات أخطاء كاذبة أو مسيئة، ولا ما يخالف قوانين الدولة، بما في ذلك معايير المحتوى الإعلامي وقانون مكافحة الشائعات والجرائم الإلكترونية.</p>
<h2>4. الدقة وتصنيفاتنا</h2><p>نتحقق من الأخبار وفق <a href="/editorial.html">سياستنا التحريرية</a> ونصنّف كل خبر (إعلان رسمي، مؤكَّد، قيد التطور، مصدر واحد). تتغير الأخبار بسرعة والملخصات قصيرة، لذا اقرأ التقرير الأصلي دائماً قبل الاعتماد على أي خبر. تُعدّ الترجمات العربية والفرنسية والألمانية بمساعدة الذكاء الاصطناعي ويراجعها محررونا؛ وتسود النسخة الإنجليزية عند الاختلاف.</p>
<h2>5. الأسواق والطقس ومواقيت الصلاة والأبراج</h2><ul><li><b>الأسواق</b> لقطة بتاريخ محدد وليست أسعاراً مباشرة، وليست نصيحة مالية.</li><li><b>الطقس</b> من Open-Meteo وقد يختلف عن التوقعات الرسمية.</li><li><b>مواقيت الصلاة</b> محسوبة بطريقة الإمارات وقد تختلف دقيقة أو اثنتين عن الجدول الرسمي؛ راجع المسجد أو الأوقاف.</li><li><b>الأبراج</b> للتسلية فقط.</li></ul>
<h2>6. الملكية الفكرية</h2><p>ملخصات بي نيوز وتصميمه وشعاره وبرمجياته ملك لـ[[الاسم القانوني للشركة]]. يمكنك مشاركة روابط صفحاتنا. المقالات المرتبطة والأسماء والعلامات ملك لأصحابها.</p>
<h2>7. روابط لمواقع أخرى</h2><p>نضع روابط للناشرين والمنظمين، ولسنا مسؤولين عن محتواهم أو ممارساتهم.</p>
<h2>8. المسؤولية</h2><p>بالقدر الذي يسمح به قانون الدولة، يُقدَّم بي نيوز "كما هو"، ولا نتحمل مسؤولية الخسائر غير المباشرة أو القرارات المتخذة اعتماداً على محتواه. لا تحدّ هذه الشروط من أي مسؤولية لا يجوز تحديدها قانوناً.</p>
<h2>9. التعديلات وإنهاء الخدمة</h2><p>قد نحدّث هذه الشروط وننشر التعديلات هنا، وقد نعلّق الحسابات المخالفة.</p>
<h2>10. القانون والنزاعات</h2><p>تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة [[وإمارة دبي]]، وتختص محاكم [[دبي]] بالنظر في النزاعات.</p>
<h2>11. التواصل</h2><p>[[الاسم القانوني للشركة]]، [[العنوان المسجل]]. البريد: <span class="ph">[[hello@نطاقك]]</span>.</p>
"""}

EDITORIAL = {
"en": """
<h1>Editorial policy</h1>
<p class="updated">{updated}</p>
<p>BeeNews exists to help readers in the UAE be the first to know, and to know that what they read has been checked. This policy explains how we choose, check, label and correct stories.</p>
<h2>1. Where our stories come from</h2>
<p>Stories enter our review queue only from an approved list: national news agencies, government and health authorities, international agencies and established newsrooms. Newsletters and roundups are treated as leads and labelled <b>Single source</b> until confirmed. Where we have a licence, full text and photographs may be used; otherwise we publish our own short summary and link to the original.</p>
<h2>2. How we check</h2>
<ol><li>The key claim (numbers, quotes, official decisions) is traced to the primary statement, study or filing.</li>
<li>Where that is not available, we look for a second, independent approved source.</li>
<li>Duplicate reports of the same event are merged; we link to the fullest original and list the others.</li>
<li>Health and political stories need an editor's approval before they appear. The database refuses to publish them otherwise.</li>
<li>Every story gets one label and a time stamp.</li></ol>
<h2>3. Our labels</h2>
<table><tr><th>Label</th><th>Meaning</th></tr>
<tr><td>Official announcement</td><td>Comes directly from a government, regulator, health authority or the organisation itself.</td></tr>
<tr><td>Corroborated</td><td>Confirmed by at least two independent approved sources, or by the primary document.</td></tr>
<tr><td>Developing</td><td>The situation is still changing; details may be updated.</td></tr>
<tr><td>Single source</td><td>Reported by one source so far. Treat as unconfirmed.</td></tr></table>
<h2>4. Corrections</h2>
<p>Anyone can use <b>Report an error</b> on a story or our <a href="/contact.html">contact page</a>. An editor reviews each report, aiming to respond within [[2 working days]]. When we correct a story, we update it, note the correction with the time on the story itself, and list it on our <a href="/corrections.html">corrections page</a>. We do not silently change facts.</p>
<h2>5. Use of AI</h2>
<p>AI tools help us collect, sort, summarise and translate stories, and read stories aloud. They cannot guarantee accuracy, so editors review what we publish, and each story keeps its label and its link to the original source.</p>
<h2>6. Standards we follow</h2>
<p>We follow the UAE media content standards issued under Federal Decree-Law No. 55 of 2023, including respect for religions, the state and its institutions, privacy and children, and the duty not to publish false news or rumours. We give people and organisations named in a story a fair chance to have errors corrected.</p>
<h2>7. Independence and advertising</h2>
<p>Editorial choices are made by editors, not advertisers. If we publish advertising or sponsored content, it will be clearly labelled and kept separate from news.</p>
<h2>8. Responsible editor</h2>
<p>Editor-in-chief: [[name]]. Media licence: [[application in progress — number to be added]]. Contact: <span class="ph">[[editor@your-domain]]</span>.</p>
""",
"ar": """
<h1>السياسة التحريرية</h1>
<p class="updated">{updated}</p>
<p>وُجد بي نيوز ليساعد القراء في الإمارات على أن يكونوا أول من يعرف، وأن يثقوا بأن ما يقرؤونه قد جرى التحقق منه. توضح هذه السياسة كيف نختار الأخبار ونتحقق منها ونصنّفها ونصحّحها.</p>
<h2>1. من أين تأتي أخبارنا</h2><p>لا تدخل الأخبار قائمة المراجعة إلا من قائمة معتمدة: وكالات الأنباء الوطنية، والجهات الحكومية والصحية، والوكالات الدولية، وغرف الأخبار الراسخة. تُعامل النشرات والملخصات كمعلومات أولية وتُصنّف "مصدر واحد" حتى تأكيدها. نستخدم النص الكامل والصور حيث نملك ترخيصاً، وإلا ننشر ملخصنا القصير مع رابط للأصل.</p>
<h2>2. كيف نتحقق</h2><ol><li>نتتبع المعلومة الأساسية (الأرقام، الاقتباسات، القرارات الرسمية) حتى البيان أو الدراسة أو الوثيقة الأصلية.</li><li>إن لم تتوفر، نبحث عن مصدر معتمد ثانٍ ومستقل.</li><li>ندمج التقارير المكررة للحدث نفسه، ونضع رابط أوفى تقرير أصلي ونذكر البقية.</li><li>تحتاج الأخبار الصحية والسياسية إلى موافقة محرر قبل ظهورها، وترفض قاعدة البيانات نشرها دون ذلك.</li><li>يحصل كل خبر على تصنيف واحد ووقت نشر.</li></ol>
<h2>3. تصنيفاتنا</h2><table><tr><th>التصنيف</th><th>المعنى</th></tr><tr><td>إعلان رسمي</td><td>صادر مباشرة عن جهة حكومية أو تنظيمية أو صحية أو عن الجهة المعنية.</td></tr><tr><td>مؤكَّد</td><td>أكّده مصدران معتمدان مستقلان على الأقل، أو الوثيقة الأصلية.</td></tr><tr><td>قيد التطور</td><td>الوضع ما زال يتغير وقد تُحدَّث التفاصيل.</td></tr><tr><td>مصدر واحد</td><td>نقله مصدر واحد حتى الآن، ويُعامل على أنه غير مؤكَّد.</td></tr></table>
<h2>4. التصحيحات</h2><p>يمكن لأي شخص استخدام زر <b>الإبلاغ عن خطأ</b> في الخبر أو <a href="/contact.html">صفحة التواصل</a>. يراجع محرر كل بلاغ ونسعى للرد خلال [[يومي عمل]]. عند تصحيح خبر نحدّثه ونذكر التصحيح ووقته في الخبر نفسه وفي <a href="/corrections.html">صفحة التصحيحات</a>، ولا نغيّر الحقائق بصمت.</p>
<h2>5. استخدام الذكاء الاصطناعي</h2><p>تساعدنا أدوات الذكاء الاصطناعي في جمع الأخبار وفرزها وتلخيصها وترجمتها وقراءتها صوتياً. لا تضمن هذه الأدوات الدقة، لذا يراجع المحررون ما ننشره، ويحتفظ كل خبر بتصنيفه ورابط مصدره الأصلي.</p>
<h2>6. المعايير التي نلتزم بها</h2><p>نلتزم بمعايير المحتوى الإعلامي الصادرة بموجب المرسوم بقانون اتحادي رقم 55 لسنة 2023، ومنها احترام الأديان والدولة ومؤسساتها والخصوصية والأطفال، وعدم نشر الأخبار الكاذبة أو الشائعات. ونمنح الأشخاص والجهات المذكورة في الأخبار فرصة عادلة لتصحيح الأخطاء.</p>
<h2>7. الاستقلالية والإعلانات</h2><p>يتخذ المحررون القرارات التحريرية لا المعلنون. وإذا نشرنا إعلانات أو محتوى مموّلاً فسيُميَّز بوضوح ويُفصل عن الأخبار.</p>
<h2>8. المحرر المسؤول</h2><p>رئيس التحرير: [[الاسم]]. الترخيص الإعلامي: [[الطلب قيد الإجراء — يُضاف الرقم لاحقاً]]. التواصل: <span class="ph">[[editor@نطاقك]]</span>.</p>
"""}
