# BeeNews — Bee the First to Know

A digital news app for desktop and mobile. Readers get checked headlines with short summaries that link to
the original publishers, and can create an account to customise the homepage they see every time they open the app.

**Sections:** AI · GCC · Health & Wellness · Sports & Events · Politics · Cars · UAE Events · Markets · Horoscope
**Languages:** English, Arabic (right-to-left), French, German

## What's in this repository

| Path | What it is |
|---|---|
| `index.html` | The app: layout, sections, filters, languages, the bundled first edition (28 Oct 2026) |
| `js/backend.js` | Supabase layer: sign-up/sign-in, Google sign-in, password reset, account deletion, saved preferences, "For You" homepage, live content loading |
| `css/app.css` | Styles for the account, customise and For You features |
| `config.js` | Your Supabase URL and anon key (empty = demo mode) |
| `supabase/migrations/…_init.sql` | Database tables, security rules (RLS), sign-up trigger, delete-account function |
| `supabase/seed.sql` | The first edition: 52 stories, 24 events, rates, market quotes, horoscopes, with translations |
| `manifest.webmanifest`, `sw.js`, `icons/` | Makes BeeNews installable on phones and desktops |
| `tools/gen_seed.js` | Regenerates `seed.sql` from the edition in `index.html` |

## Demo mode
With `config.js` left empty the app runs on its own: it shows the bundled edition, and "Customise" saves
preferences on the reader's device only. Open `index.html` through any static host to try it.

## Connect Supabase
1. **Create a project** at supabase.com.
2. **Create the database.** In the SQL Editor, run `supabase/migrations/20261028000000_init.sql`, then `supabase/seed.sql`.
   (Or with the Supabase CLI: `supabase link` then `supabase db push`, and run the seed file.)
3. **Auth settings** (Authentication → URL Configuration): set the Site URL to where you host the app, for example
   `https://gaylerylliam-art.github.io/beenews/`, and add the same address under Redirect URLs.
4. **Google sign-in (optional):** Authentication → Providers → Google, add your Google OAuth client ID and secret.
   Until it's enabled, the "Continue with Google" button shows an error from Supabase.
5. **Keys:** copy the Project URL and the `anon` public key from Project Settings → API into `config.js`.
   The anon key is safe to publish because the security rules decide what it can do. Never put the `service_role` key in the app.
6. **Make yourself an editor:** sign up in the app, then in the SQL Editor run
   `insert into public.editors (user_id) select id from auth.users where email = 'you@example.com';`

## The editorial rule, enforced by the database
Health and political stories are marked `sensitive`. The database refuses to publish a sensitive story until an editor
approves it, so 23 seeded stories start as `in_review` and don't appear in the app yet. After reviewing them, an editor approves with:

```sql
update public.stories set editor_approved = true, status = 'published' where id in ('ph-impeach', 'ma-gov');  -- list the reviewed ids
```
Approval records who approved and when. Corrections go in `story_corrections`.

## Publishing a new edition
Editors add or update rows in `stories`, `events`, `fx_rates`, `market_quotes` and `horoscopes` (Table Editor or SQL).
The app reads them on every open. Automating this from licensed feeds (for example a scheduled Supabase Edge Function) is the next step.

## Host it
Any static host works. For GitHub Pages: repository Settings → Pages → deploy from the `main` branch, root folder.

## Notes
- Headlines and summaries are written by BeeNews; full articles and photos remain with their publishers. Photos need a licence.
- Market figures in the first edition are a dated snapshot, not live prices, and are not financial advice.
- Arabic, French and German text was translated with AI and should be reviewed by native speakers.
- Accounts store personal data (email, name, preferences): publish a privacy policy and follow the UAE Personal Data Protection Law. Readers can delete their account from the Account menu.
