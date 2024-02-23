---
"astro": minor
---

The astro middleware now runs when a matching page or endpoint is not found. Previously, a `pages/404.astro` or `pages/[...catch-all].astro` route had to match to allow middleware. This is now not necessary.

Note that some adapters may need to update to let Astro's SSR code handle the not-found case.
