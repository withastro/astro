---
'create-astro': patch
---

Fixes dependency installation failing on release days when your package manager enforces a minimum release age (e.g. pnpm `minimumReleaseAge`, npm `min-release-age`). Official templates now install the newest version old enough to satisfy the policy.
