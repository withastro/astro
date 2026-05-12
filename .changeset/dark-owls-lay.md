---
'astro': patch
---

Strips `client:only` component imports from the Rollup graph during prerender builds, preventing build errors from client-side-only dependencies being processed in SSR context
