---
"astro": minor
---

The astro middleware now runs when a matching page or endpoint is not found. Previously, a `pages/404.astro` or `pages/[...catch-all].astro` route had to match to allow middleware. This is now not necessary.

When a route does not match in SSR deployments, your adapter may show a platform-specific 404 page instead of running Astro's SSR code. In these cases, you may still need to add a `404.astro` or fallback route with spread params, or use a routing configuration option if your adapter provides one.
