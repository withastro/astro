---
'astro': patch
---

Fixes a bug where the custom 404 (or 500) page was not rendered when a middleware rewrite targeted a route that returned an empty 404/500 response, and a blank page was returned instead
