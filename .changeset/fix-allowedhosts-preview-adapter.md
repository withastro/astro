---
'astro': patch
'@astrojs/cloudflare': patch
---

Pass `server.allowedHosts` to adapter preview entrypoints so non-localhost Host headers are no longer blocked with 403 when using `astro preview` with the Cloudflare adapter
