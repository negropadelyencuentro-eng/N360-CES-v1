const CACHE_NAME = "n360-ces-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.png",
  "/favicon-white.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Solo cachear GET, no Supabase ni APIs externas
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase.co")) return;
  if (e.request.url.includes("wger.de")) return;
  if (e.request.url.includes("fonts.googleapis")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cachear assets estáticos
        if (e.request.url.match(/\.(js|css|png|jpg|svg|woff2?)$/)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match("/index.html"));
    })
  );
});
