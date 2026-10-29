// BeeNews service worker: makes the app installable and opens the last edition when offline.
// News data from Supabase is never cached here, so readers always get fresh content when online.
const CACHE = "beenews-shell-v1";
const SHELL = ["./", "index.html", "config.js", "js/backend.js", "css/app.css", "manifest.webmanifest",
               "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // Supabase, fonts and CDNs go straight to the network
  // Network first for the app shell, falling back to the cached copy when offline.
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("index.html"))));
});
