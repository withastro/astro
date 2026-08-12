---
'astro': patch
---

Fixes the Fonts API breaking `experimental.incrementalBuild` caching by embedding a build-local, randomly-assigned server port in generated code used for the dependency hash

