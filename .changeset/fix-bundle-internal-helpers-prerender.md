---
"astro": patch
---

Suppresses `[WARN] Vite warning: unused imports from "@astrojs/internal-helpers/remote"` during prerender builds. The package is now bundled alongside `astro` in the prerender environment, matching how it is handled in the SSR environment.
