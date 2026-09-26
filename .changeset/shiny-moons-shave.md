---
'@astrojs/cloudflare': patch
---

Fixes `astro build` failing with `fetch failed` / `connect ECONNREFUSED 127.0.0.1:<port>` during prerendering on hosts where `localhost` resolves to IPv6

The prerenderer started its Vite preview server with `host: 'localhost'` and then built the fetch URL by re-stating that same hostname. `localhost` was therefore resolved twice, independently — once by `listen()` to pick a bind address and once by `fetch()` to pick a connect address — with nothing making the two agree. On hosts where those resolutions land on different families, the preview server listens on `::1` while `fetch` dials `127.0.0.1`, and every prerender request is refused. The URL is now derived from the address actually bound, so bind and connect agree by construction.
