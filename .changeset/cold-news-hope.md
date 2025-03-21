---
'@astrojs/cloudflare': minor
---

Adds global `astro:env` support

Cloudflare workers [now support importing `env` in the global scope](https://developers.cloudflare.com/changelog/2025-03-17-importable-env/). Until now, calling `astro:env` APIs had to be done within request scope or the values were `undefined`.

With this release, they can be called anywhere server-side, like any other official adapter.