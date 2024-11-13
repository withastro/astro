---
'astro': patch
---

Fixes a bug where configured redirects were incorrectly constructed when reading the file system.

This caused an issue where configuring a redirect in `astro.config.mjs` like `{ /old: /new }`, failed to trigger the correct redirect in the dev server.
