---
'@astrojs/ts-content-mapper': patch
---

Fixes named imports of Astro components (e.g. `import { Footer } from './Footer.astro'`) not being reported as errors when type-checking with `tsc`
