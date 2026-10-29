# BeeNews launch checklist

Everything in this repository is ready to switch on. The steps below are the parts only the owner can do (accounts, keys, legal review). Each one is independent, so you can do them in any order. The website keeps working at every step.

---

## 1. Database: run the launch migration (do this first, 2 minutes)

1. Supabase → **SQL Editor** → New query.
2. Open `supabase/migrations/20261029000000_launch.sql`, copy **all of its contents**, paste, and press **Run**.

This adds:
- the BeeNews brief and breaking-news fields on stories
- sign-up consent records
- saved stories and reading history synced to accounts
- the "Report an error" inbox
- approved sources and the feed queue
- an audit log
- alert subscriptions
- privacy-friendly usage counts and the crash log

Your existing stories, accounts and settings are untouched.

After it runs, existing accounts (including yours) are asked once to accept the Terms and Privacy policy. That is expected.

## 2. Legal pages: fill in and get them reviewed

- Edit `tools/legal_content.py`. Replace every `[[highlighted placeholder]]`: company legal name, trade licence, address, emails, Supabase region, minimum age, courts.
- Then run `python3 tools/build_pages.py`. It regenerates `privacy.html`, `terms.html` and `editorial.html`.
- Edit the placeholders in `contact.html` directly.
- **Have a UAE-qualified lawyer review all three pages before launch.** They are drafts written against:
  - Federal Decree-Law 45/2021 (PDPL)
  - Federal Decree-Law 55/2023 (media law and content standards)
  - the cybercrime law
- When the lawyer is happy, remove the yellow "Draft" banner by deleting the `<div class="pg-draft" …>` line in each page (or keep it until then).
- **Media licence:** the pages and footer say "application in progress". When the UAE Media Council issues the licence:
  - put the number in `contact.html` and in `editorial.html` (section 8)
  - change `lgLicence` in `index.html` and `licence` in `js/page.js`
- If you change the Terms later, bump `TERMS_VERSION` in `js/backend.js`. Every reader is then asked to accept again.

## 3. Newsroom (editor dashboard)

- Open **`/admin.html`** on your site and sign in with your BeeNews account.
- Your account must be on the editors list (SQL editor):
  ```sql
  insert into public.editors (user_id) select id from auth.users where email = 'YOUR-EMAIL';
  ```
- From the dashboard you can:
  - write, edit, approve, publish and retract stories
  - log public corrections
  - handle reader reports
  - manage sources
  - see usage and app errors

  No SQL is needed.

## 4. Daily content pipeline (headlines from feeds → review queue)

Needs the Supabase CLI once (`npm i -g supabase`, then `supabase login` and `supabase link --project-ref ievzgeyqwacqmdfifhde`).

```bash
supabase functions deploy ingest
supabase secrets set INGEST_SECRET=<make-up-a-long-random-string>
```

- In the dashboard → **Sources**, add the RSS feed URL for each source you're allowed to use, and record the permission.
- Schedule it in SQL Editor: Database → Extensions → enable `pg_cron` and `pg_net`, then run:

```sql
select cron.schedule('beenews-ingest', '0 3,9,15 * * *', $$
  select net.http_post(
    url := 'https://ievzgeyqwacqmdfifhde.supabase.co/functions/v1/ingest',
    headers := jsonb_build_object('Authorization', 'Bearer <INGEST_SECRET>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);
```

This runs at 07:00, 13:00 and 19:00 Dubai time (03:00, 09:00 and 15:00 UTC). New headlines appear in **Newsroom → From feeds**. Nothing is published without an editor.

## 5. Story pages and share previews

These work automatically after deploy:
- `/story/<id>` pages
- WhatsApp, X and LinkedIn previews (Netlify edge function `story-og`)
- `/sitemap.xml`

Two settings to finish:
- Netlify → Site configuration → Environment variables: optionally add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Without them the functions read `config.js`.
- In `config.js`, set `siteUrl` to your public address (for example `https://beenews.ae`).
- Submit `https://<your-site>/sitemap.xml` in Google Search Console.

## 6. Sign in with Apple (required by Apple if the app offers Google sign-in)

1. Apple Developer account (USD 99/year) → Certificates, IDs & Profiles:
   - create a **Services ID** and a **Sign in with Apple key**
   - add the return URL `https://ievzgeyqwacqmdfifhde.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Apple**: enter the Services ID, Team ID, Key ID and the key.
3. In `config.js`, set `appleSignIn: true`.
4. Supabase → Authentication → URL Configuration → **Redirect URLs**: add `ae.beenews.app://auth-callback` (the app's return link).

## 7. Store-ready apps (iOS and Android)

The `android/` and `ios/` projects are generated (Capacitor 8.5). The app ID is `ae.beenews.app`; change it in `capacitor.config.json` before your first store upload if you prefer another.

```bash
npm install
npm run android   # opens Android Studio  → Build → Generate Signed Bundle (.aab) → Google Play Console
npm run ios       # opens Xcode (on a Mac) → set your Team → Product → Archive → App Store Connect
```

Store listing needs:
- the privacy policy URL (`/privacy.html`)
- a support URL (`/contact.html`)
- the in-app account deletion (already in Account → Delete account)
- screenshots
- age rating (news)
- Apple's App Privacy and Google's Data safety forms; `privacy.html` section 1 lists exactly what is collected

## 8. Breaking-news alerts (web push)

```bash
npx web-push generate-vapid-keys
supabase secrets set VAPID_PUBLIC_KEY=<public> VAPID_PRIVATE_KEY=<private> VAPID_SUBJECT=mailto:<your email> SITE_URL=https://<your-site>
supabase functions deploy notify
```

- Put the **public** key in `config.js` → `vapidPublicKey`.
- Readers turn alerts on in **Account**.
- When an editor publishes a story with **Breaking** ticked, the alert goes to readers who follow that section.
- Native app push (APNs and Firebase) can be added later with `@capacitor/push-notifications`.

## 9. Ask BeeNews (AI assistant) and AI translation drafts

```bash
supabase secrets set ANTHROPIC_API_KEY=<key from console.anthropic.com>
supabase functions deploy ask
supabase functions deploy editor-ai
```

- `ask`: signed-in readers type requests in **Customise → Ask BeeNews**. It can suggest homepage settings (applied only when they press Save) and pick published stories to read aloud. Limit: 20 requests per reader per day (`ASK_DAILY_LIMIT`).
- `editor-ai`: the "Draft translations with AI" button in the Newsroom. An Arabic, French and German speaker should check drafts before publishing.

## 10. Captcha, rate limits and branded emails

- **Captcha:**
  1. Cloudflare → Turnstile → add your site.
  2. Put the site key in `config.js` → `turnstileSiteKey`.
  3. Supabase → Authentication → Attack Protection → enable CAPTCHA with the secret key.
- **Rate limits:** Supabase → Authentication → Rate Limits (for example 30 sign-ups per hour, 5 emails per hour per address). Error reports are already capped in the database.
- **Emails:**
  1. Supabase → Authentication → SMTP Settings: use your own sender (for example Amazon SES, Postmark or Resend) with `noreply@<your-domain>`.
  2. Supabase → Authentication → Email Templates: paste `supabase/templates/confirm.html`, `recovery.html`, `magic_link.html` and `email_change.html`.

## 11. Licensed market data and premium voices (when contracts are signed)

- **Markets:** today's figures are a dated snapshot entered by editors. Live prices need a licensed data feed (for example DFM/ADX data vendors, Refinitiv or Twelve Data). The `market_quotes` and `fx_rates` tables are where a scheduled function would write them.
- **Voices:** read-aloud uses each device's built-in voice for free. Premium voices (for example Azure Neural or ElevenLabs Arabic voices) can be added as a function that returns audio for a story's BeeNews brief. Only use your own briefs, not publishers' full articles, unless licensed.

## 12. Analytics and crash reports

These are already on. They store:
- daily totals per event, with no account IDs, IP addresses or cookies
- short error messages

You can see both in **Newsroom → Usage & errors**. To switch them off, set `analytics: false` in `config.js`.
