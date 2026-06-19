---
'@astrojs/language-server': patch
'@astrojs/ts-plugin': patch
---

Fixes a false positive TS6133 diagnostic ("declared but never read") for variables only referenced inside top-level `return` statements in Astro frontmatter
