---
'@astrojs/netlify': minor
---

When `session: false` is set in `astro.config`, the adapter no longer auto-wires the Netlify Blobs session driver. Combined with the matching `astro` change, this lets the session runtime tree-shake out of the function bundle.
