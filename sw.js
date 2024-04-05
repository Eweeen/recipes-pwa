const version = "v3";
const cacheName = `myapp-${version}`;
const fileToCache = [
  "/index.html",
  "/main.js",
  "style.css",
  "icons/icon-512x512.png",
  "icons/bookmark-regular.svg",
  "icons/bookmark-solid.svg",
];

self.addEventListener("install", (e) => {
  console.log("[SW] Installed");
  e.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(fileToCache))
  );
});

self.addEventListener("fetch", (e) => {
  console.log("[SW] Fetching url: ", e.request.url);
  e.respondWith(
    (async () => {
      // If the request has already been cached,
      // return the cached value to avoid uncessary network usage.
      const match = await caches.match(e.request);
      if (match) return match;

      const response = await fetch(e.request);
      const cacheControl = response.headers.get("Cache-Control");

      if (
        e.request.method === "GET" &&
        !(cacheControl === "no-cache" || cacheControl === "no-store")
      ) {
        const cache = await caches.open(cacheName);
        console.log("[SW] Caching new resource: ", e.request.url);
        cache.put(e.request, response.clone());
      }

      return response;
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key === cacheName) return;
          return caches.delete(key);
        })
      );
    })()
  );
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "recipes") {
    e.waitUntil(fetchRecipes());
  }
});
