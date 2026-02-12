---
'astro': patch
---

Fixes content layer loaders that use dynamic imports

Content collection loaders can now use `await import()` and `import.meta.glob()` to dynamically import modules during build. Previously, these would fail with "Vite module runner has been closed."
