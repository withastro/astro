---
'astro': patch
---

Fixes styles from Markdoc/MDX custom components not being extracted to `<head>` in the dev server when using the Cloudflare adapter with `prerenderEnvironment: 'node'` and rendering content through a wrapper component.
