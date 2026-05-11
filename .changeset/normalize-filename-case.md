---
'astro': patch
---

Fixes styles being stripped when the project root is started with a path whose case differs from the actual filesystem case (e.g. running `astro dev` from `d:\dev\app` while the folder on disk is `D:\dev\app`). `normalizeFilename` now treats absolute paths inside the project as project-internal even when their case does not exactly match the configured root, so the cached compile metadata lookup no longer misses and the virtual style module resolves correctly.
