---
'astro': patch
---

Fixes a build regression in projects with multiple frontend integrations where `server:defer` server islands could fail at runtime when all pages are prerendered.
