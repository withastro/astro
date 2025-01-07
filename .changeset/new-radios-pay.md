---
'astro': patch
---

Improve static asset generation performance by removing the `await` in the `for` loop. This change will allow the p-queue concurrency to limit the number of parallel tasks. Previously, the `await` in the `for` loop would cause all asset generation tasks to run serially.

Fixes #12845
