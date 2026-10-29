// BeeNews service worker: makes the app installable and opens the last edition when offline.
// News data from Supabase is never cached here, so readers always get fresh content when online.
const CACHE = "beenews-shell-v7";
const SHELL = ["./", "index.html", "config.js", "js/backend.js", "css/app.css", "css/modern.css", "css/pages.css", "js/page.js", "js/story.js", "story.html", "js/ui.js", "js/praytimes.js", "images/cards/ai1.webp", "images/cards/ai2.webp", "images/cards/ai3.webp", "images/cards/ai4.webp", "images/cards/chip.webp", "images/cards/cars.webp", "images/cards/econ1.webp", "images/cards/econ2.webp", "images/cards/navy.webp", "images/cards/politics.webp", "images/cards/sports.webp", "images/cards/uae.webp", "images/cards/travel.webp", "images/logo-en-120.webp", "images/logo-en-240.webp", "images/logo-ar-120.webp", "images/logo-ar-240.webp", "images/logo-en-dark-120.webp", "images/logo-en-dark-240.webp", "images/logo-ar-dark-120.webp", "images/logo-ar-dark-240.webp", "manifest.webmanifest",
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

// Breaking-news alerts
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "BeeNews", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "BeeNews", {
    body: d.body || "", tag: d.tag || "beenews", icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url || "/" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url === url && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
