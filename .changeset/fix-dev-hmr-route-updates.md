---
'astro': patch
---

Fixes stale route matching in the dev server after route files change. Route updates (adding, removing, or renaming pages) are now applied as a single atomic route-table replacement visible to every consumer at once — the route matcher, the custom 404 fallback, and rewrites — where previously some consumers kept matching against a stale route table until the dev server restarted.
