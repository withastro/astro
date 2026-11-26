---
'astro': patch
'@astrojs/runtime': patch
---

Fixes prerendered pages with server islands producing different HTML on every build. When `ASTRO_KEY` is set, building the same source now gives byte-identical HTML, so deploy tools that skip unchanged files no longer re-upload every page. Pages rendered on demand still encrypt server island data with a random IV.
