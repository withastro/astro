---
'@astrojs/cloudflare': patch
---

Fixes a Cloudflare adapter regression where importing an `.astro` component as a default export from a `.ts` file failed with `No matching export in "html:..." for import "default"`. The internal `astro-frontmatter-scan` esbuild plugin now scopes its `onLoad` handler to the `file` namespace, so `.astro` files resolved into Vite's `html` namespace fall through to Vite's built-in handler instead of being intercepted by the frontmatter-only loader.
