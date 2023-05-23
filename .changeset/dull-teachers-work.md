---
'astro': patch
---

Make vite-plugin-content-virtual-mod run `getEntrySlug` 10 at a time to prevent `EMFILE: too many open files` error
