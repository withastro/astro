---
'@astrojs/check': patch
---

Fixes the `astro-check` binary dropping the first two arguments it is given, which made flags such as `--watch`, `--root` and `--minimumFailingSeverity` silently fall back to their default values. Running `astro check` through the Astro CLI was not affected.
