---
'@astrojs/upgrade': patch
---

Fixes `@astrojs/upgrade` showing a generic error when pnpm's `minimumReleaseAge` policy blocks installation. The error message now explains that pnpm's policy blocked the update and suggests running the install command manually.
