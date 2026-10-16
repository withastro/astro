---
'@astrojs/check': patch
---

Fixes `astro check --watch` printing a result summary for a check that was cancelled by a newer file change, and ignoring the entire project when its path contains a `node_modules` or `.git` segment. The `--help` description of `--preserveWatchOutput` now matches what the flag does.
