---
"astro": patch
---

Fixes an issue that causes static entrypoints build to fail because of the path in certain conditions. Specifically, it failed if the path had an extension (like `.astro`, `.mdx` etc) and such extension would be also within the path (like `./.astro/index.astro`).
