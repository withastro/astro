---
"astro": patch
---

Fixes a regression where the dev server was returning a 404 when hitting an endpoint, when the app was configured with `trailingSlash: "always"`
