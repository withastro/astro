---
'astro': patch
---

Fixes hybrid-mode SSR bundles incorrectly including prerendered pages that are the target of a config-level redirect. The redirect's target is now only added to the page map for the build environment that matches its own `prerender` flag, so prerendered targets are no longer pulled into the server function.
