---
'astro-scripts': patch
---

Chore: remove memory test from CI workflow. This causes issues with Vite 3 dependency resolution, and is no longer necessary for testing our compiler.
