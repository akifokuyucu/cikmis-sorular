// Çevrimdışı kullanım ve hızlı açılış için service worker. Yalnız yayında kaydedilir (index.html sonu);
// SURUM ve ON_YUKLE'yi scripts/yayin.py doldurur.
// - Sayfa (HTML): önce ağ, ağ yoksa önbellek → arayüz güncellemeleri hemen görünür.
// - veri.<özet>.js: adı içeriğinin özeti olduğu için değişmez; önbellekte varsa ağa hiç gidilmez.
// - Görseller ve ikonlar: önbellekten hemen verilir, arka planda yenilenir. Ayrı önbellekte durur,
//   böylece her yeni sürümde yeniden indirilmez.
const SURUM = "1f38b5492b";
const ON_YUKLE = ["./", "./index.html", "./veri.618f3fe2cd.js", "./manifest.webmanifest", "./logo-96.png", "./logo-192.png"];
const KABUK = "soru-havuzu-kabuk-" + SURUM;
const DOSYA = "soru-havuzu-dosya";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(KABUK).then(c => c.addAll(ON_YUKLE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(adlar => Promise.all(
    adlar.filter(a => a !== KABUK && a !== DOSYA).map(a => caches.delete(a)))));
  self.clients.claim();
});

const sakla = (ad, istek, yanit) => {
  if (yanit.ok) { const kopya = yanit.clone(); caches.open(ad).then(c => c.put(istek, kopya)); }
  return yanit;
};

self.addEventListener("fetch", e => {
  const istek = e.request;
  const url = new URL(istek.url);
  if (istek.method !== "GET" || url.origin !== location.origin) return;

  if (istek.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(istek).then(y => sakla(KABUK, istek, y))
      .catch(() => caches.match(istek, { ignoreSearch: true }).then(y => y || caches.match("./index.html"))));
  } else if (/\/veri\.[0-9a-f]+\.js$/.test(url.pathname)) {
    e.respondWith(caches.match(istek).then(y => y || fetch(istek).then(y => sakla(KABUK, istek, y))));
  } else {
    e.respondWith(caches.match(istek).then(onbellekte => {
      const ag = fetch(istek).then(y => sakla(DOSYA, istek, y)).catch(() => onbellekte);
      if (onbellekte) e.waitUntil(ag);
      return onbellekte || ag;
    }));
  }
});
