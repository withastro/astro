---
'@astrojs/cloudflare': patch
---

Moves `prismjs` from `devDependencies` to `dependencies` for `@astrojs/cloudflare` so the runtime import in the Prism Vite plugin resolves for consumers of the adapter.