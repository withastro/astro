---
"astro": patch
---

Fix a bug where `server:defer` could fail at runtime in prerendered pages for some adapters (including Cloudflare), causing errors like `serverIslandMap?.get is not a function`.
