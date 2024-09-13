---
'astro': patch
---

Fix getStaticPaths regression

This reverts a previous change meant to remove a dependency, to fix a regression with multiple nested spread routes.
