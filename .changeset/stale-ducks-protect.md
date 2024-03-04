---
"astro": patch
---

Fixes an issue that causes static entrypoints build to fail when the path contains the extension several times. For instance, `./.astro/index.astro` caused such issue.
