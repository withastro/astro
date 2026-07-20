---
'@astrojs/cloudflare': patch
---

Fixes a dev server crash when using Astro Actions with the Cloudflare adapter. The actions server entrypoints and `astro/zod` are now pre-bundled for the server environment, so they are no longer discovered mid-request. Previously, that late discovery triggered an SSR dependency re-optimization that could invalidate in-flight `deps_ssr` chunks and crash the dev server with a "file does not exist" error.
