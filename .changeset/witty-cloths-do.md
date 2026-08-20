---
'astro': patch
---

Fixes a build failure when defining `vite.environments.ssr` in the Astro config. User-provided environment config for `ssr`, `prerender`, or `client` is now properly deep-merged with Astro's internal environment settings instead of silently breaking the server entry naming.
