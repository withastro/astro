---
'create-astro': patch
'@astrojs/telemetry': patch
'astro': patch
---

Swapped out the preferred-pm and which-pm packages and replaced them with @skarab/detect-package-manager.

Standardized variable naming by changing all instances of pkgManager to packageManager to ensure consistent wording throughout the codebase.

Modified the next-steps.ts file in the create-astro package to accommodate the aforementioned changes.

These changes aim to streamline package detection (particularly Bun), enhance naming clarity, and optimize the logic in next-steps.ts for the create-astro package.
