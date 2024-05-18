---
"astro": patch
---

Prevent cache content from being left in dist folder

When `contentCollectionsCache` is enabled temporary cached content is copied into the `outDir` for processing. This fixes it so that this content is cleaned out, along with the rest of the temporary build JS.
