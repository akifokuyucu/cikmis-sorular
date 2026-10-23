// Çevrimdışı kullanım için basit service worker: önce ağ, ağ yoksa önbellek.
// Önce ağ denendiği için veri ve arayüz güncellemeleri hemen görünür; önbellek yalnızca çevrimdışıyken kullanılır.
const ONBELLEK = "soru-havuzu-v2";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(["./index.html", "./veri.js", "./manifest.webmanifest", "./logo-96.png", "./logo-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(yanit => {
        if (yanit.ok) { const kopya = yanit.clone(); caches.open(ONBELLEK).then(c => c.put(e.request, kopya)); }
        return yanit;
      })
      .catch(() => caches.match(e.request))
  );
});
