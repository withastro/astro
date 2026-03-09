---
"astro": patch
---

Fixes a race condition where concurrent requests to dynamic routes in the dev server could produce incorrect params.
