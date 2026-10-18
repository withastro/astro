---
'@astrojs/upgrade': patch
---

Respects the package manager's minimum release age policy (npm `min-release-age`, pnpm `minimum-release-age`) when choosing which versions to install, instead of pinning versions that the policy then blocks
