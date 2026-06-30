---
'@astrojs/language-server': patch
---

Fixes `astro check` crashing with out-of-memory errors when large minified files are included in the tsconfig scope.

The diagnostic formatter now detects files with very long lines (e.g. minified bundles) and skips expensive per-diagnostic formatting that could exhaust the heap. Diagnostic counts are still reported in the summary. A per-file cap on formatted diagnostics is also applied as a safety measure.
