---
'@astrojs/cloudflare': patch
---

Fixes auto-provisioning of default bindings (SESSION KV, IMAGES, and ASSETS). Default bindings are now correctly applied whether or not you have a `wrangler.json` file.
Previously, these bindings were only added when no wrangler config file existed. Now they are added in both cases, unless you've already defined them yourself.
