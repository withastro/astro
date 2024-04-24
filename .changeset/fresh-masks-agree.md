---
"@astrojs/mdx": major
---

Refactors the MDX transformation to rely only on the unified pipeline. Babel and esbuild transformations are removed, which should result in faster build times. The refactor requires using Astro v4.8.0 but no other changes are necessary.
