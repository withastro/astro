---
'astro': patch
---

Fixes an issue where HMR would not trigger when modifying files while using @astrojs/cloudflare with prerenderEnvironment: 'node' enabled.
