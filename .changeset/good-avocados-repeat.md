---
'@astrojs/cloudflare': patch
---

Support for prerendering in the Cloudflare integration

This fixes prerendering in the Cloudflare adapter. Now any prerendered routes are added to the `_routes.json` config so that the worker script is skipped for those routes.
