---
'astro': patch
---

Fixes a one-time page reload shortly after the first load on cold dev-server starts when a project has framework components imported from MDX content entries. MDX files are now included in the dev dependency pre-bundling scan, so their framework dependencies are bundled up front instead of being discovered (and reloaded for) at runtime.