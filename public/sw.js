const VERSION = "jelly-tower-v4";
const ROOT = new URL("./", self.location.href);
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      const response = await fetch(ROOT, { cache: "reload" });
      if (!response.ok) throw new Error("App shell unavailable");
      const html = await response.clone().text();
      const assets = [
        ...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g),
      ].map((match) => new URL(match[1], ROOT).href);
      await cache.put(ROOT, response);
      await cache.addAll(
        [
          ...assets,
          "manifest.webmanifest",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/maskable-512.png",
          "icons/apple-touch-icon.png",
          "icons/jelly.svg",
        ].map((path) => new URL(path, ROOT).href),
      );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("jelly-tower-") && key !== VERSION)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== ROOT.origin
  )
    return;
  event.respondWith(
    (async () => {
      if (event.request.mode === "navigate") {
        try {
          return await fetch(event.request);
        } catch {
          return await caches.match(ROOT);
        }
      }
      return (
        (await caches.match(event.request, { ignoreVary: true })) ||
        fetch(event.request)
      );
    })(),
  );
});
