---
'astro': patch
---

Fixes SSR-emitted assets (CSS, fonts, images) missing from the manifest when using the Node adapter in middleware mode with a catch-all route. These assets are now included in `manifest.assets` so the adapter correctly identifies them as static files instead of matching them against routes.
