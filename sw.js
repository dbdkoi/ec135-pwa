/* Service Worker · Cache-First. La versión cambia sola con cada build (hash del index.html cifrado). */
const C = 'ec135-8a435a288670';
const F = ['./index.html', './manifest.json'];
/* Copia limpia: algunos hostings redirigen /index.html a / y una respuesta «redirected» no vale para navegar */
const clean = async r => r.redirected ? new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(C);
  await Promise.all(F.map(async u => { const r = await fetch(u, { cache: 'reload' }); if (!r.ok) throw new Error(u + ' ' + r.status); const k = await clean(r); await c.put(u, k.clone()); if (u === './index.html') await c.put('./', k); }));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const q = e.request; if (q.method !== 'GET' || new URL(q.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    const hit = q.mode === 'navigate' ? await c.match('./index.html') : await c.match(q, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(q); if (r.ok && r.type === 'basic') c.put(q, (await clean(r.clone()))); return r; }
    catch (x) { return (await c.match('./index.html')) || Response.error(); }
  })());
});
