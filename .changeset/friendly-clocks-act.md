---
'create-astro': patch
'@astrojs/telemetry': patch
'astro': patch
---

With this PR, I want to propose the usage of @skarab/detect-package-manager for detecting package managers instead of preferred-pm and which-pm.

Standardized variable naming by changing all instances of pkgManager to packageManager to ensure consistent wording throughout the codebase.

Correctly runs `bunx astro add` when adding an integration.
