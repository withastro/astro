---
'astro': patch
---

Fixes CJS dependencies imported from `.astro` component packages (e.g. `prismjs/components/index.js` via `@astrojs/prism`) not being pre-bundled as ESM when using the Cloudflare adapter, causing a `require is not defined` error in workerd during dev
