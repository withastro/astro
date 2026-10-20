---
'@astrojs/cloudflare': patch
---

Fixes a custom `src/fetch.ts` rendering truncated pages without islands or hoisted scripts in `astro dev` when `prerenderEnvironment: 'node'` is set
