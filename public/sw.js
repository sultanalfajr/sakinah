/**
 * عامل خدمة سَكِينَة — خفيفٌ ومهذّب:
 *   • يخزّن الهيكل الأساسي للعمل دون اتصال.
 *   • يمرّر واجهات API وملفات التلاوة كما هي (بلا تخزين — حفاظًا على Range).
 *   • شبكة أولًا للصفحات، وذاكرة أولًا للأصول الثابتة.
 */
const CACHE = "sakinah-v1";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(PRECACHE.map((u) => cache.add(u)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  /* التلاوات وواجهات البرمجة — تُمرَّر للشبكة بلا أي تدخّل */
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/quran/")) return;

  /* الصفحات — شبكة أولًا مع رجوعٍ للذاكرة دون اتصال */
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        }
      })()
    );
    return;
  }

  /* الأصول الثابتة — ذاكرة أولًا */
  const staticAsset =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:svg|png|ico|webp|woff2?|css)$/.test(url.pathname);

  if (staticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
        }
        return res;
      })()
    );
  }
});
