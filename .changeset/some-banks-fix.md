---
'@astrojs/cloudflare': patch
---

Fixes a bug where an explicit `cache: { enabled: false }` in your wrangler config was overridden and forced to `true` when a Workers cache provider was configured
