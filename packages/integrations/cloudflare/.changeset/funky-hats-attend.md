---
'@astrojs/cloudflare': patch
---

Load vars from wrangler.json/.jsonc in dev mode, removing the need to duplicate vars in .dev.vars in order for astro:env can validate them.
