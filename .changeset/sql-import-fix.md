---
'astro': patch
---

Fixes an issue where `.sql` files (and other non-asset module types) were incorrectly moved to the client assets folder during SSR builds, causing "no such module" errors at runtime.

The `ssrMoveAssets` function now reads the Vite manifest to determine which files are actual client assets (CSS and static assets like images) and only moves those, leaving server-side module files in place.
