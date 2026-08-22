---
'astro': patch
---

Fixes a false "package not installed" error when a dependency (such as TypeScript 7+) no longer exposes a default entry in its `exports` map. Astro now falls back to checking `package.json` resolution before prompting to install the package.
