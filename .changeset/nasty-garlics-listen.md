---
'astro': patch
---

Reimplement https://github.com/withastro/astro/pull/7509 to correctly emit pre-rendered pages now that `build.split` is deprecated and this configuration has been moved to `functionPerRoute` inside the adapter.
