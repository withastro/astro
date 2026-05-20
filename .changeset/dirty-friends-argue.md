---
'@astrojs/cloudflare': patch
---

Reverts a change to the esbuild dep-scan plugin that caused `astro check` and `astro build` to fail by making esbuild incorrectly bundle `virtual:` modules (e.g. from expressive-code)
