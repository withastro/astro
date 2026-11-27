---
'@astrojs/ts-plugin': patch
---

Fixes auto-import in `.ts` files inserting `import { Footer } from './Footer.astro'` for Astro components instead of a default import, and reports named imports of Astro components as errors
