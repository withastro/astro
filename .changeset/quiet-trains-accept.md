---
'@astrojs/cloudflare': patch
---

Prebundle additional Astro runtime dependencies for Cloudflare dev to reduce SSR dependency discovery churn, which is necessary to get Starlight + Cloudflare working reliably from a cold optimizer cache.

Note: `@astrojs/cloudflare/entrypoints/server` is intentionally excluded from the prebundle list because it can fail optimization with `Could not resolve "cloudflare:workers"`.
