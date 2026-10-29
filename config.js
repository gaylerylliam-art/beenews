// BeeNews configuration.
// Paste your Supabase project URL and anon (public) key here — Project Settings → API in the Supabase dashboard.
// The anon key is meant to be public: Row Level Security in supabase/migrations decides what it can read and write.
// Never put the service_role key in this file.
// Leave both empty to run in demo mode: the bundled edition is shown and preferences stay on the device.
window.BEENEWS_CONFIG = {
  supabaseUrl: "https://ievzgeyqwacqmdfifhde.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldnpnZXlxd2FjcW1kZmlmaGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNDcxMzAsImV4cCI6MjEwODgyMzEzMH0.bhV6G2qvUwhEg14UnPL-lzn4FwbIMCLc7shVVq-K-5M",

  siteUrl: "",               // public address, e.g. "https://beenews.ae" (share links and emails from the app)

  // Optional launch features. Each stays off until you fill it in (see LAUNCH.md).
  appleSignIn: false,        // true once Sign in with Apple is enabled in Supabase -> Authentication -> Providers
  turnstileSiteKey: "",      // Cloudflare Turnstile site key (public); also turn on Supabase -> Auth -> Bot protection
  vapidPublicKey: "",        // public VAPID key for breaking-news alerts (private key only in Supabase secrets)
  analytics: true            // daily totals only, no personal data; set false to switch off
};
