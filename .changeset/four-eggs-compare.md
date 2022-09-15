---
'astro': minor
---

Adds a new "astro:build:generated" hook that runs after SSG builds finish but **before** build artifacts are cleaned up. This is a very specific use case, "astro:build:done" is probably what you're looking for.
