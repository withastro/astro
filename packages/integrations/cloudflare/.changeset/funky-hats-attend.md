---
'@astrojs/cloudflare': patch
---

Updates config file loading so that vars from wrangler.json/.jsonc are loaded dev mode, removing the need to duplicate vars in .dev.vars.
