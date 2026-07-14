---
'@astrojs/node':  minor
---

When `session: false` is set in `astro.config`, the adapter no longer auto-wires the filesystem session driver. Combined with the matching `astro` change, this lets the session runtime tree-shake out of the server bundle.
