---
"@astrojs/language-server": patch
---

Improves completion performance

Completion performance is improved by fixing a bug where we were giving the TypeScript compiler API the wrong name of files, causing it to search for files for a long time.
