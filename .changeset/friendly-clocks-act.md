---
'create-astro': patch
'@astrojs/telemetry': patch
'astro': patch
---

Update preferred-pm and which-pm-runs packages as the latest versions now support Bun.

Standardized variable naming by changing all instances of pkgManager to packageManager to ensure consistent wording throughout the codebase.

`bunx astro add` command correctly uses bun.

Telemetry notice returns package manager.
