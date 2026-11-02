---
'astro': patch
---

Avoids clearing unrelated remote SSR modules during dev updates, reducing duplicate module instances in in-flight requests when using the Cloudflare adapter.
