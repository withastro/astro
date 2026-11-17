---
'@astrojs/ts-plugin': patch
---

Fixes auto-imports of `.astro` components in `.ts` files suggesting a named import (`import { Footer } from './Footer.astro'`), and reports an error for such named imports since Astro components only have a default export
