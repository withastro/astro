---
'@astrojs/upgrade': patch
---

Respects the package manager's minimum release age policy (npm `min-release-age`, pnpm `minimum-release-age`) when choosing which versions to install. Previously the newest version was pinned even when the policy blocked it, so the install failed. Now the newest version old enough is installed, or the package is reported as up to date if nothing newer is allowed yet.

pnpm's existing `minimumReleaseAge` error message is kept as a fallback. Yarn and Bun are not covered yet and still fail if the latest version is blocked by their release age policies.
